import parsePhoneNumberFromString from 'libphonenumber-js';

export const getCountryFromPhoneNumber = (phoneNumber: string) => {
  const parsedNumber = parsePhoneNumberFromString(phoneNumber);
  if (parsedNumber && parsedNumber.isValid()) {
    const country = parsedNumber.country;
    return country;
  } else {
    return 'Invalid phone number';
  }
};
