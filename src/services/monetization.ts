export interface MonetizationAdapter {
  rewardedHintsAvailable: boolean;
  adsRemoved: boolean;
  showRewardedHint(): Promise<boolean>;
  showBetweenCaseInterstitial(): Promise<void>;
  purchaseRemoveAds(): Promise<boolean>;
}

/**
 * The game never depends on this adapter. A store/ad implementation can replace it
 * later without touching scoring or investigation state.
 */
export const monetization: MonetizationAdapter = {
  rewardedHintsAvailable: false,
  adsRemoved: false,
  async showRewardedHint() { return false; },
  async showBetweenCaseInterstitial() { return undefined; },
  async purchaseRemoveAds() { return false; },
};
