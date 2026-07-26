export type Country = {
  name: string;
  iso2: string;
  dial: string;
};

/** Common countries for the contact form's Country / phone dial-code fields. */
export const COUNTRIES: Country[] = [
  { name: "Pakistan", iso2: "PK", dial: "+92" },
  { name: "United States", iso2: "US", dial: "+1" },
  { name: "United Kingdom", iso2: "GB", dial: "+44" },
  { name: "United Arab Emirates", iso2: "AE", dial: "+971" },
  { name: "Saudi Arabia", iso2: "SA", dial: "+966" },
  { name: "India", iso2: "IN", dial: "+91" },
  { name: "Canada", iso2: "CA", dial: "+1" },
  { name: "Australia", iso2: "AU", dial: "+61" },
  { name: "Germany", iso2: "DE", dial: "+49" },
  { name: "France", iso2: "FR", dial: "+33" },
  { name: "Netherlands", iso2: "NL", dial: "+31" },
  { name: "Spain", iso2: "ES", dial: "+34" },
  { name: "Italy", iso2: "IT", dial: "+39" },
  { name: "Sweden", iso2: "SE", dial: "+46" },
  { name: "Norway", iso2: "NO", dial: "+47" },
  { name: "Ireland", iso2: "IE", dial: "+353" },
  { name: "Switzerland", iso2: "CH", dial: "+41" },
  { name: "Turkey", iso2: "TR", dial: "+90" },
  { name: "Qatar", iso2: "QA", dial: "+974" },
  { name: "Kuwait", iso2: "KW", dial: "+965" },
  { name: "Bahrain", iso2: "BH", dial: "+973" },
  { name: "Oman", iso2: "OM", dial: "+968" },
  { name: "China", iso2: "CN", dial: "+86" },
  { name: "Japan", iso2: "JP", dial: "+81" },
  { name: "South Korea", iso2: "KR", dial: "+82" },
  { name: "Singapore", iso2: "SG", dial: "+65" },
  { name: "Malaysia", iso2: "MY", dial: "+60" },
  { name: "Indonesia", iso2: "ID", dial: "+62" },
  { name: "Bangladesh", iso2: "BD", dial: "+880" },
  { name: "Sri Lanka", iso2: "LK", dial: "+94" },
  { name: "Nepal", iso2: "NP", dial: "+977" },
  { name: "Afghanistan", iso2: "AF", dial: "+93" },
  { name: "Iran", iso2: "IR", dial: "+98" },
  { name: "Egypt", iso2: "EG", dial: "+20" },
  { name: "South Africa", iso2: "ZA", dial: "+27" },
  { name: "Nigeria", iso2: "NG", dial: "+234" },
  { name: "Kenya", iso2: "KE", dial: "+254" },
  { name: "Brazil", iso2: "BR", dial: "+55" },
  { name: "Mexico", iso2: "MX", dial: "+52" },
  { name: "Argentina", iso2: "AR", dial: "+54" },
  { name: "New Zealand", iso2: "NZ", dial: "+64" },
  { name: "Poland", iso2: "PL", dial: "+48" },
  { name: "Portugal", iso2: "PT", dial: "+351" },
  { name: "Belgium", iso2: "BE", dial: "+32" },
  { name: "Austria", iso2: "AT", dial: "+43" },
  { name: "Denmark", iso2: "DK", dial: "+45" },
  { name: "Finland", iso2: "FI", dial: "+358" },
  { name: "Greece", iso2: "GR", dial: "+30" },
  { name: "Russia", iso2: "RU", dial: "+7" },
  { name: "Ukraine", iso2: "UA", dial: "+380" },
  { name: "Philippines", iso2: "PH", dial: "+63" },
  { name: "Vietnam", iso2: "VN", dial: "+84" },
  { name: "Thailand", iso2: "TH", dial: "+66" },
  { name: "Israel", iso2: "IL", dial: "+972" },
  { name: "Jordan", iso2: "JO", dial: "+962" },
  { name: "Iraq", iso2: "IQ", dial: "+964" },
  { name: "Other", iso2: "XX", dial: "+" },
];

/** Unicode flag emoji from an ISO 3166-1 alpha-2 code (regional indicator symbols). */
export function flagEmoji(iso2: string): string {
  if (iso2 === "XX") return "🌐";
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}
