export const generateReferralCode = () => {
  const namePart = "FW";
  const randomDigits = Math.floor(100000 + Math.random() * 9000); // Random 4 digit number
  return `${namePart}${randomDigits}`;
};

export const randomUsername = () => {
  const characters = "0123456789";
  let result = "";
  const length = 5;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return `FUTURE${result}`;
};
