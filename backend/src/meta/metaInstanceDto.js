function toSafeInstanceDto(instance) {
  if (!instance) return instance;
  const { accessToken, ...safeInstance } = instance;
  return safeInstance;
}

function toSafeCampaignInstances(campaign) {
  if (!campaign) return campaign;

  return {
    ...campaign,
    instance: toSafeInstanceDto(campaign.instance),
    campaignInstances: Array.isArray(campaign.campaignInstances)
      ? campaign.campaignInstances.map((campaignInstance) => ({
        ...campaignInstance,
        instance: toSafeInstanceDto(campaignInstance.instance)
      }))
      : campaign.campaignInstances
  };
}

module.exports = { toSafeCampaignInstances, toSafeInstanceDto };
