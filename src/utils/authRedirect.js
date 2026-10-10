// Shared by MarketingAuth (signup) and AcceptInvite (staff invite accept) -
// both backend endpoints return the same {redirect_url, handoff_code} shape
// so the browser can be handed off to the right shop subdomain the same way
// in either flow: hard-redirect if a workspace subdomain is configured,
// otherwise fall back to exchanging the handoff code same-origin.
export async function completeAuthRedirect({ redirect_url: redirectUrl, handoff_code: handoffCode }, loginWithHandoff) {
    if (redirectUrl) {
        window.location.href = redirectUrl
        return { success: true, redirected: true }
    }
    return loginWithHandoff(handoffCode)
}
