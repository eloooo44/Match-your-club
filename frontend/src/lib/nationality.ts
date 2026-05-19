import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import deLocale from "i18n-iso-countries/langs/de.json";

countries.registerLocale(enLocale);
countries.registerLocale(deLocale);

const COUNTRY_ALIASES: Record<string, string> = {
  österreich: "AT",
  austria: "AT",
  deutschland: "DE",
  germany: "DE",
  schweiz: "CH",
  switzerland: "CH",
  "cote d'ivoire": "CI",
  "côte d'ivoire": "CI",
  "ivory coast": "CI",
  elfenbeinküste: "CI",
  "czech republic": "CZ",
  tschechien: "CZ",
  "north macedonia": "MK",
  mazedonien: "MK",
  macedonia: "MK",
  "viet nam": "VN",
  vietnam: "VN",
  "palestinian territory": "PS",
  palestine: "PS",
  "hong kong": "HK",
  macao: "MO",
  curaçao: "CW",
  curacao: "CW",
  turkey: "TR",
  türkei: "TR",
  "united kingdom": "GB",
  uk: "GB",
  "great britain": "GB",
  "united states": "US",
  usa: "US",
};

const CUSTOM_NATIONALITIES = [
  { isoCode: "XK", emojiFlag: "🇽🇰", country: "Kosovo" },
  { isoCode: "GB-ENG", emojiFlag: "🏴", country: "England" },
  { isoCode: "GB-SCT", emojiFlag: "🏴", country: "Schottland" },
  { isoCode: "GB-WLS", emojiFlag: "🏴", country: "Wales" },
];

const flagFromAlpha2 = (alpha2: string) => {
  return alpha2
    .toUpperCase()
    .replace(/./g, (character) =>
      String.fromCodePoint(0x1f1e6 + character.charCodeAt(0) - 65),
    );
};

const stripExistingFlag = (value: string) => {
  return value.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, "").trim();
};

const lookupCountryCode = (value: string) => {
  const normalized = value.toLowerCase().trim();
  const customNationality = CUSTOM_NATIONALITIES.find(
    (nationality) => nationality.country.toLowerCase() === normalized,
  );

  return (
    customNationality?.isoCode ??
    COUNTRY_ALIASES[normalized] ??
    countries.getAlpha2Code(value, "de") ??
    countries.getAlpha2Code(value, "en")
  );
};

const countryNameFromCode = (countryCode: string) => {
  const customNationality = CUSTOM_NATIONALITIES.find(
    (nationality) => nationality.isoCode === countryCode,
  );

  return customNationality?.country ?? countries.getName(countryCode, "de");
};

const flagFromCountryCode = (countryCode: string) => {
  const customNationality = CUSTOM_NATIONALITIES.find(
    (nationality) => nationality.isoCode === countryCode,
  );

  return customNationality?.emojiFlag ?? flagFromAlpha2(countryCode);
};

export const normalizeNationalityForStorage = (value?: string) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  const plainNationality = stripExistingFlag(trimmed);
  const countryCode = lookupCountryCode(plainNationality);

  return countryCode ? (countryNameFromCode(countryCode) ?? plainNationality) : plainNationality;
};

export const formatNationalityWithFlag = (value?: string) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "Nicht angegeben";
  }

  const plainNationality = stripExistingFlag(trimmed);
  const countryCode = lookupCountryCode(plainNationality);

  if (!countryCode) {
    return plainNationality;
  }

  return `${flagFromCountryCode(countryCode)} ${countryNameFromCode(countryCode) ?? plainNationality}`;
};

export const normalizeNationalityForDisplay = stripExistingFlag;

const defaultNationalityOptions = Object.entries(countries.getNames("de"))
  .map(([isoCode, country]) => ({
    isoCode,
    country,
    emojiFlag: flagFromCountryCode(isoCode),
    label: `${flagFromCountryCode(isoCode)} ${country}`,
  }))
  .sort((first, second) => first.country.localeCompare(second.country, "de"));

export const nationalityOptions = [
  ...defaultNationalityOptions,
  ...CUSTOM_NATIONALITIES.map((nationality) => ({
    ...nationality,
    label: `${nationality.emojiFlag} ${nationality.country}`,
  })),
].sort((first, second) => first.country.localeCompare(second.country, "de"));
