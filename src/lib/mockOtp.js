// Placeholder OTP for trial/testing — shows the code on-screen instead of
// sending a real SMS. Swap this for a Twilio-backed function later; callers
// (SignUp.jsx) don't need to change since the function signatures stay the same.

let currentCode = null
let currentPhone = null

export function sendCode(phone) {
  currentCode = String(Math.floor(100000 + Math.random() * 900000))
  currentPhone = phone
  return currentCode
}

export function verifyCode(phone, code) {
  return phone === currentPhone && code === currentCode
}
