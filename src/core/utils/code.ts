import otpGenerator from 'otp-generator';
import { addMinutesToDate } from './date';

export const quickOTP = (minutes = 2) => {
  return {
    code: otpGenerator.generate(6, {
      digits: true,
      specialChars: false,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
    }),
    expiresAt: { date: addMinutesToDate(minutes), string: `${minutes}m` },
  };
};
