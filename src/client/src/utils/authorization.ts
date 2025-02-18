export function getBase64URLEncoded(authorization: Record<string, string>) {
    return btoa(JSON.stringify(authorization))
      .replace(/\+/g, '-') // Convert '+' to '-'
      .replace(/\//g, '_') // Convert '/' to '_'
      .replace(/=+$/, '') // Remove padding `=`
}

export function getAuthProtocol(authorization: Parameters<typeof getBase64URLEncoded>[0]) {
    const header = getBase64URLEncoded(authorization)
    return `header-${header}`
}
