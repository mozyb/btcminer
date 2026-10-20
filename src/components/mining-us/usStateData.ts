export interface USState {
  abbr: string;
  name: string;
  residentialRate: number;
  commercialRate: number;
  industrialRate: number;
  climate: "Cool" | "Moderate" | "Warm" | "Hot";
  renewables: "High" | "Moderate" | "Low";
  miningFriendly: "Very Friendly" | "Friendly" | "Neutral" | "Restrictive" | "Unfriendly";
  region: "Northeast" | "Southeast" | "Midwest" | "Southwest" | "West";
}

export const usStates: USState[] = [
  { abbr: "AL", name: "Alabama", residentialRate: 0.143, commercialRate: 0.126, industrialRate: 0.074, climate: "Warm", renewables: "Moderate", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "AK", name: "Alaska", residentialRate: 0.232, commercialRate: 0.198, industrialRate: 0.152, climate: "Cool", renewables: "High", miningFriendly: "Neutral", region: "West" },
  { abbr: "AZ", name: "Arizona", residentialRate: 0.136, commercialRate: 0.112, industrialRate: 0.081, climate: "Hot", renewables: "High", miningFriendly: "Neutral", region: "Southwest" },
  { abbr: "AR", name: "Arkansas", residentialRate: 0.129, commercialRate: 0.104, industrialRate: 0.071, climate: "Moderate", renewables: "Low", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "CA", name: "California", residentialRate: 0.268, commercialRate: 0.214, industrialRate: 0.168, climate: "Warm", renewables: "High", miningFriendly: "Restrictive", region: "West" },
  { abbr: "CO", name: "Colorado", residentialRate: 0.151, commercialRate: 0.118, industrialRate: 0.089, climate: "Cool", renewables: "High", miningFriendly: "Friendly", region: "West" },
  { abbr: "CT", name: "Connecticut", residentialRate: 0.245, commercialRate: 0.184, industrialRate: 0.148, climate: "Cool", renewables: "Moderate", miningFriendly: "Unfriendly", region: "Northeast" },
  { abbr: "DE", name: "Delaware", residentialRate: 0.158, commercialRate: 0.132, industrialRate: 0.102, climate: "Moderate", renewables: "Moderate", miningFriendly: "Neutral", region: "Northeast" },
  { abbr: "FL", name: "Florida", residentialRate: 0.152, commercialRate: 0.128, industrialRate: 0.094, climate: "Hot", renewables: "Low", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "GA", name: "Georgia", residentialRate: 0.138, commercialRate: 0.116, industrialRate: 0.076, climate: "Warm", renewables: "Moderate", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "HI", name: "Hawaii", residentialRate: 0.441, commercialRate: 0.386, industrialRate: 0.322, climate: "Warm", renewables: "High", miningFriendly: "Unfriendly", region: "West" },
  { abbr: "ID", name: "Idaho", residentialRate: 0.116, commercialRate: 0.092, industrialRate: 0.061, climate: "Cool", renewables: "High", miningFriendly: "Friendly", region: "West" },
  { abbr: "IL", name: "Illinois", residentialRate: 0.161, commercialRate: 0.128, industrialRate: 0.092, climate: "Moderate", renewables: "Moderate", miningFriendly: "Neutral", region: "Midwest" },
  { abbr: "IN", name: "Indiana", residentialRate: 0.152, commercialRate: 0.122, industrialRate: 0.084, climate: "Moderate", renewables: "Low", miningFriendly: "Neutral", region: "Midwest" },
  { abbr: "IA", name: "Iowa", residentialRate: 0.141, commercialRate: 0.104, industrialRate: 0.068, climate: "Moderate", renewables: "High", miningFriendly: "Friendly", region: "Midwest" },
  { abbr: "KS", name: "Kansas", residentialRate: 0.144, commercialRate: 0.112, industrialRate: 0.079, climate: "Moderate", renewables: "High", miningFriendly: "Friendly", region: "Midwest" },
  { abbr: "KY", name: "Kentucky", residentialRate: 0.128, commercialRate: 0.106, industrialRate: 0.074, climate: "Moderate", renewables: "Low", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "LA", name: "Louisiana", residentialRate: 0.132, commercialRate: 0.112, industrialRate: 0.072, climate: "Hot", renewables: "Moderate", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "ME", name: "Maine", residentialRate: 0.228, commercialRate: 0.168, industrialRate: 0.132, climate: "Cool", renewables: "High", miningFriendly: "Neutral", region: "Northeast" },
  { abbr: "MD", name: "Maryland", residentialRate: 0.174, commercialRate: 0.142, industrialRate: 0.108, climate: "Moderate", renewables: "Moderate", miningFriendly: "Unfriendly", region: "Northeast" },
  { abbr: "MA", name: "Massachusetts", residentialRate: 0.312, commercialRate: 0.206, industrialRate: 0.168, climate: "Cool", renewables: "Moderate", miningFriendly: "Unfriendly", region: "Northeast" },
  { abbr: "MI", name: "Michigan", residentialRate: 0.191, commercialRate: 0.138, industrialRate: 0.102, climate: "Cool", renewables: "Moderate", miningFriendly: "Neutral", region: "Midwest" },
  { abbr: "MN", name: "Minnesota", residentialRate: 0.164, commercialRate: 0.122, industrialRate: 0.088, climate: "Cool", renewables: "High", miningFriendly: "Friendly", region: "Midwest" },
  { abbr: "MS", name: "Mississippi", residentialRate: 0.136, commercialRate: 0.112, industrialRate: 0.078, climate: "Warm", renewables: "Low", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "MO", name: "Missouri", residentialRate: 0.148, commercialRate: 0.112, industrialRate: 0.078, climate: "Moderate", renewables: "Low", miningFriendly: "Neutral", region: "Midwest" },
  { abbr: "MT", name: "Montana", residentialRate: 0.128, commercialRate: 0.102, industrialRate: 0.066, climate: "Cool", renewables: "High", miningFriendly: "Friendly", region: "West" },
  { abbr: "NE", name: "Nebraska", residentialRate: 0.122, commercialRate: 0.098, industrialRate: 0.074, climate: "Moderate", renewables: "High", miningFriendly: "Friendly", region: "Midwest" },
  { abbr: "NV", name: "Nevada", residentialRate: 0.166, commercialRate: 0.112, industrialRate: 0.084, climate: "Hot", renewables: "High", miningFriendly: "Neutral", region: "West" },
  { abbr: "NH", name: "New Hampshire", residentialRate: 0.234, commercialRate: 0.176, industrialRate: 0.142, climate: "Cool", renewables: "Moderate", miningFriendly: "Unfriendly", region: "Northeast" },
  { abbr: "NJ", name: "New Jersey", residentialRate: 0.184, commercialRate: 0.152, industrialRate: 0.118, climate: "Moderate", renewables: "Moderate", miningFriendly: "Unfriendly", region: "Northeast" },
  { abbr: "NM", name: "New Mexico", residentialRate: 0.146, commercialRate: 0.112, industrialRate: 0.078, climate: "Warm", renewables: "High", miningFriendly: "Friendly", region: "Southwest" },
  { abbr: "NY", name: "New York", residentialRate: 0.232, commercialRate: 0.178, industrialRate: 0.138, climate: "Cool", renewables: "High", miningFriendly: "Restrictive", region: "Northeast" },
  { abbr: "NC", name: "North Carolina", residentialRate: 0.138, commercialRate: 0.112, industrialRate: 0.076, climate: "Moderate", renewables: "Moderate", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "ND", name: "North Dakota", residentialRate: 0.112, commercialRate: 0.092, industrialRate: 0.064, climate: "Cool", renewables: "High", miningFriendly: "Very Friendly", region: "Midwest" },
  { abbr: "OH", name: "Ohio", residentialRate: 0.158, commercialRate: 0.122, industrialRate: 0.086, climate: "Moderate", renewables: "Low", miningFriendly: "Neutral", region: "Midwest" },
  { abbr: "OK", name: "Oklahoma", residentialRate: 0.134, commercialRate: 0.106, industrialRate: 0.072, climate: "Moderate", renewables: "Moderate", miningFriendly: "Friendly", region: "Southwest" },
  { abbr: "OR", name: "Oregon", residentialRate: 0.142, commercialRate: 0.112, industrialRate: 0.078, climate: "Cool", renewables: "High", miningFriendly: "Friendly", region: "West" },
  { abbr: "PA", name: "Pennsylvania", residentialRate: 0.182, commercialRate: 0.142, industrialRate: 0.098, climate: "Cool", renewables: "Moderate", miningFriendly: "Neutral", region: "Northeast" },
  { abbr: "RI", name: "Rhode Island", residentialRate: 0.258, commercialRate: 0.194, industrialRate: 0.158, climate: "Cool", renewables: "Moderate", miningFriendly: "Unfriendly", region: "Northeast" },
  { abbr: "SC", name: "South Carolina", residentialRate: 0.144, commercialRate: 0.116, industrialRate: 0.076, climate: "Warm", renewables: "Low", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "SD", name: "South Dakota", residentialRate: 0.128, commercialRate: 0.102, industrialRate: 0.074, climate: "Cool", renewables: "High", miningFriendly: "Friendly", region: "Midwest" },
  { abbr: "TN", name: "Tennessee", residentialRate: 0.132, commercialRate: 0.106, industrialRate: 0.074, climate: "Moderate", renewables: "Moderate", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "TX", name: "Texas", residentialRate: 0.148, commercialRate: 0.102, industrialRate: 0.068, climate: "Hot", renewables: "High", miningFriendly: "Very Friendly", region: "Southwest" },
  { abbr: "UT", name: "Utah", residentialRate: 0.126, commercialRate: 0.098, industrialRate: 0.074, climate: "Cool", renewables: "Moderate", miningFriendly: "Friendly", region: "West" },
  { abbr: "VT", name: "Vermont", residentialRate: 0.206, commercialRate: 0.162, industrialRate: 0.128, climate: "Cool", renewables: "High", miningFriendly: "Neutral", region: "Northeast" },
  { abbr: "VA", name: "Virginia", residentialRate: 0.146, commercialRate: 0.118, industrialRate: 0.084, climate: "Moderate", renewables: "Moderate", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "WA", name: "Washington", residentialRate: 0.124, commercialRate: 0.092, industrialRate: 0.064, climate: "Cool", renewables: "High", miningFriendly: "Very Friendly", region: "West" },
  { abbr: "WV", name: "West Virginia", residentialRate: 0.152, commercialRate: 0.122, industrialRate: 0.082, climate: "Moderate", renewables: "Low", miningFriendly: "Neutral", region: "Southeast" },
  { abbr: "WI", name: "Wisconsin", residentialRate: 0.172, commercialRate: 0.128, industrialRate: 0.092, climate: "Cool", renewables: "Moderate", miningFriendly: "Neutral", region: "Midwest" },
  { abbr: "WY", name: "Wyoming", residentialRate: 0.122, commercialRate: 0.092, industrialRate: 0.062, climate: "Cool", renewables: "High", miningFriendly: "Very Friendly", region: "West" },
];

export function getMiningFriendlinessColor(friendliness: USState["miningFriendly"]) {
  switch (friendliness) {
    case "Very Friendly": return "bg-success text-success-foreground";
    case "Friendly": return "bg-primary text-primary-foreground";
    case "Neutral": return "bg-muted text-foreground";
    case "Restrictive": return "bg-warning text-warning-foreground";
    case "Unfriendly": return "bg-destructive text-destructive-foreground";
  }
}

export function getMiningFriendlinessRank(friendliness: USState["miningFriendly"]) {
  const ranks: Record<USState["miningFriendly"], number> = {
    "Very Friendly": 5,
    "Friendly": 4,
    "Neutral": 3,
    "Restrictive": 2,
    "Unfriendly": 1,
  };
  return ranks[friendliness];
}
