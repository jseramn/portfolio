export type SuccessState = {
  envelopeId: string
  passphrase: string
}

export type FallbackState = {
  envelopeId: string
  passphrase: string
  armored: string
  mailtoHref: string
  mailtoTruncated: boolean
}

export type KeyDeliverySocial = {
  id: string
  label: string
  href: string
}
