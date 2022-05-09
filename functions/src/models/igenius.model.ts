export interface iGeniusUser {
  id?: number;
  name?: string;
  country?: string;
  pv?: number;
  enrollVolume?: number;
  qev?: number;
  bvLeft?: number;
  bvRight?: number;
  activeLeft?: number;
  activeRight?: number;
  currentRank?: string;
  highestRank?: string;
  subscription?: string;
  monthRollingLeft?: number;
  monthRollingRight?: number;
  leftAndHolding?: number;
  rightAndHolding?: number;
  lastOrder?: Date;
  lastOrderBV?: number;
  joinDate?: Date;
  username?: string;
  enrollerName?: string;
  email?: string;
}

export interface iGeniusUserResponse {
  completion: number;
  completionMsg: string;
  error?: Error;
  user?: iGeniusUser;
}
