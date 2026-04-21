const prisma = require('../config/database');
const embeddingService = require('./embeddingService');
const { uploadFile } = require('./storageService');
const fs = require('fs');

class KnowledgeService {
  /**
   * Split text into chunks (~500 tokens each with overlap)
   */
  chunkText(text, maxChunkSize = 1500, overlap = 200) {
    // Split by double newlines (paragraphs) first
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    const chunks = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + '\n\n' + para).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        // Overlap: keep last part of previous chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5));
        currentChunk = overlapWords.join(' ') + '\n\n' + para;
      } else {
        currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // If no natural breaks, split by sentences
    if (chunks.length === 0 && text.trim()) {
      chunks.push(text.trim());
    }

    return chunks;
  }

  /**
   * Extract text from a file based on its type
   */
  async extractText(file) {
    const ext = file.originalname.toLowerCase().split('.').pop();

    switch (ext) {
      case 'pdf': {
        const pdfParse = require('pdf-parse');
        const buffer = fs.readFileSync(file.path);
        const data = await pdfParse(buffer);
        return data.text;
      }
      case 'docx': {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: file.path });
        return result.value;
      }
      case 'xlsx':
      case 'xls': {
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(file.path);
        let allText = '';
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          // Convert to CSV-like text so the AI can understand table structure
          const csv = XLSX.utils.sheet_to_csv(sheet);
          allText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
        }
        return allText;
      }
      case 'csv': {
        return fs.readFileSync(file.path, 'utf-8');
      }
      case 'txt':
      case 'md': {
        return fs.readFileSync(file.path, 'utf-8');
      }
      default:
        throw new Error(`Unsupported file type: .${ext}. Supported: .pdf, .docx, .xlsx, .csv, .txt, .md`);
    }
  }

  /**
   * Process and store table/structured data as knowledge (e.g. price lists, product catalogs)
   * Each row becomes a separate knowledge chunk for precise retrieval.
   */
  async addTableKnowledge({ agentId, title, headers, rows, category, tags }) {
    const results = [];

    // Create a summary chunk with all headers
    const headerLine = headers.join(' | ');
    const summaryLines = [`جدول: ${title}`, `الأعمدة: ${headerLine}`, `عدد الصفوف: ${rows.length}`];
    
    // Batch rows into groups of 10 for embedding (too many individual chunks is wasteful)
    const batchSize = 10;
    for (let batchStart = 0; batchStart < rows.length; batchStart += batchSize) {
      const batch = rows.slice(batchStart, batchStart + batchSize);
      const batchText = batch.map(row => {
        // Create natural language from row: "المنتج: X | السعر: Y | ..."
        return headers.map((h, i) => `${h}: ${row[i] || ''}`).join(' | ');
      }).join('\n');

      const chunkText = `${headerLine}\n---\n${batchText}`;
      const chunkIndex = Math.floor(batchStart / batchSize);

      try {
        const embedding = await embeddingService.generateEmbedding(chunkText);
        const vectorStr = `[${embedding.join(',')}]`;

        const result = await prisma.$queryRawUnsafe(`
          INSERT INTO "AgentKnowledge" (id, "agentId", title, content, "sourceType", category, tags, "chunkIndex", embedding, "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, 'table', $4, $5::text[], $6, $7::vector, true, NOW(), NOW())
          RETURNING id, title, "chunkIndex"
        `, agentId, `${title} (${chunkIndex + 1}/${Math.ceil(rows.length / batchSize)})`, chunkText, category || null, tags || [], chunkIndex, vectorStr);

        results.push(result[0]);
      } catch (error) {
        console.error(`[KnowledgeService] Error embedding table batch ${chunkIndex}:`, error.message);
      }
    }

    console.log(`[KnowledgeService] Added table "${title}": ${results.length} chunks from ${rows.length} rows`);
    return { title, chunks: results.length, totalRows: rows.length };
  }

  /**
   * Process and store a text knowledge source
   */
  async addTextKnowledge({ agentId, title, content, category, tags }) {
    const chunks = this.chunkText(content);
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await embeddingService.generateEmbedding(chunks[i]);
        const vectorStr = `[${embedding.join(',')}]`;

        // Use raw SQL for vector insert (Prisma doesn't support vector type natively)
        const result = await prisma.$queryRawUnsafe(`
          INSERT INTO "AgentKnowledge" (id, "agentId", title, content, "sourceType", category, tags, "chunkIndex", embedding, "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, 'text', $4, $5::text[], $6, $7::vector, true, NOW(), NOW())
          RETURNING id, title, "chunkIndex"
        `, agentId, `${title}${chunks.length > 1 ? ` (${i + 1}/${chunks.length})` : ''}`, chunks[i], category || null, tags || [], i, vectorStr);

        results.push(result[0]);
      } catch (error) {
        console.error(`[KnowledgeService] Error embedding chunk ${i}:`, error.message);
      }
    }

    console.log(`[KnowledgeService] Added ${results.length}/${chunks.length} chunks for "${title}"`);
    return results;
  }

  /**
   * Process and store a file knowledge source
   */
  async addFileKnowledge({ agentId, file, category, tags }) {
    // 1. Extract text from file
    const text = await this.extractText(file);
    if (!text || text.trim().length < 10) {
      throw new Error('Could not extract meaningful text from file');
    }

    // 2. Upload original file to MinIO
    let fileUrl = null;
    let fileKey = null;
    try {
      fileUrl = await uploadFile(file);
      fileKey = `knowledge/${Date.now()}-${file.originalname}`;
    } catch (error) {
      console.warn('[KnowledgeService] MinIO upload failed, continuing without file storage:', error.message);
    }

    // 3. Chunk text and generate embeddings
    const chunks = this.chunkText(text);
    const title = file.originalname.replace(/\.[^/.]+$/, ''); // filename without extension
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await embeddingService.generateEmbedding(chunks[i]);
        const vectorStr = `[${embedding.join(',')}]`;

        const result = await prisma.$queryRawUnsafe(`
          INSERT INTO "AgentKnowledge" (id, "agentId", title, content, "sourceType", "sourceUrl", "fileKey", category, tags, "chunkIndex", embedding, "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, 'file', $4, $5, $6, $7::text[], $8, $9::vector, true, NOW(), NOW())
          RETURNING id, title, "chunkIndex"
        `, agentId, `${title} (${i + 1}/${chunks.length})`, chunks[i], fileUrl, fileKey, category || null, tags || [], i, vectorStr);

        results.push(result[0]);
      } catch (error) {
        console.error(`[KnowledgeService] Error embedding file chunk ${i}:`, error.message);
      }
    }

    // Clean up temp file
    try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }

    console.log(`[KnowledgeService] Processed file "${title}": ${results.length}/${chunks.length} chunks`);

    if (results.length === 0 && chunks.length > 0) {
      throw new Error('فشلت عملية توليد الـ Embeddings. تأكد من أن خدمة Ollama تعمل وأن نموذج nomic-embed-text متاح.');
    }

    return { title, chunks: results.length, totalChunks: chunks.length, fileUrl };
  }

  /**
   * Vector similarity search for relevant knowledge
   */
  async searchKnowledge(query, agentId, limit = 5) {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const vectorStr = `[${queryEmbedding.join(',')}]`;

      const results = await prisma.$queryRawUnsafe(`
        SELECT id, title, content, "sourceType", "chunkIndex",
               1 - (embedding <=> $1::vector) as similarity
        FROM "AgentKnowledge"
        WHERE "agentId" = $2 AND "isActive" = true AND embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `, vectorStr, agentId, limit);

      return results.filter(r => r.similarity > 0.3); // Min similarity threshold
    } catch (error) {
      console.error('[KnowledgeService] Search error:', error.message);
      return [];
    }
  }

  /**
   * List knowledge sources for an agent (grouped by title)
   */
  async listKnowledge(agentId) {
    const sources = await prisma.$queryRawUnsafe(`
      SELECT 
        MIN(id) as id,
        title,
        "sourceType",
        "sourceUrl",
        "fileKey",
        category,
        COUNT(*) as "chunkCount",
        MIN("createdAt") as "createdAt",
        BOOL_AND("isActive") as "isActive"
      FROM "AgentKnowledge"
      WHERE "agentId" = $1
      GROUP BY title, "sourceType", "sourceUrl", "fileKey", category
      ORDER BY MIN("createdAt") DESC
    `, agentId);

    // PostgreSQL COUNT(*) returns BigInt — convert to Number for JSON serialization
    return sources.map(s => ({ ...s, chunkCount: Number(s.chunkCount) }));
  }

  /**
   * Delete all chunks for a knowledge source by title
   */
  async deleteKnowledgeByTitle(agentId, title) {
    const result = await prisma.agentKnowledge.deleteMany({
      where: { agentId, title: { startsWith: title } }
    });
    console.log(`[KnowledgeService] Deleted ${result.count} chunks for "${title}"`);
    return result;
  }

  /**
   * Delete a specific knowledge entry by ID
   */
  async deleteKnowledge(id, agentId) {
    // Get the title first to delete all related chunks
    const entry = await prisma.agentKnowledge.findFirst({
      where: { id, agentId }
    });

    if (!entry) throw new Error('Knowledge source not found');

    // Extract base title (remove " (1/3)" suffix)
    const baseTitle = entry.title.replace(/\s*\(\d+\/\d+\)\s*$/, '');

    const result = await prisma.agentKnowledge.deleteMany({
      where: {
        agentId,
        title: { startsWith: baseTitle }
      }
    });

    console.log(`[KnowledgeService] Deleted ${result.count} chunks for "${baseTitle}"`);
    return result;
  }
}

module.exports = new KnowledgeService();
