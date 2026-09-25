import logo from './assets/logo gscars.jpg'

const ltr = (value) => `\u200E${value}`

export const brandLogo = logo
export const BRAND_NAME = 'GS-Cars'
export const BRAND_EMAIL = 'gscarslocation@outlook.fr'
export const BRAND_EMAIL_LABEL = ltr(BRAND_EMAIL)

export const BRAND_PHONES = {
  bureau: { label: 'Bureau', display: ltr('53 106 457'), href: 'tel:+21653106457' },
  whatsapp: { label: 'WhatsApp', display: ltr('53 106 457'), href: 'https://wa.me/21653106457' },
  mobile: { label: '94 261 203', display: ltr('94 261 203'), href: 'tel:+21694261203' },
}
