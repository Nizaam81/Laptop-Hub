const crypto = require("crypto");

const generateReferralCode = (firstName, lastName) => {
  console.log(firstName, lastName);
  const firstInitial = firstName.charAt(0).toUpperCase() || "o";
  const lastInitial = lastName.charAt(0).toUpperCase() || "n";

  const randomString = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `${firstInitial}${lastInitial}${randomString}`;
};

module.exports = {
  generateReferralCode,
};
