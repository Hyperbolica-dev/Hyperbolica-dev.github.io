# MRDM private entry

The public `/tools/mrdm/` page embeds an owner-operated Streamlit service over Tailscale HTTPS. The header includes an MRDM entry. GitHub Pages remains static; it stores neither sleep records nor medication journals and has no application database.

The service URL is entered by the user and stored only in that browser's localStorage. No private hostname is committed. Only HTTPS `.ts.net` origins without credentials are accepted. Loading the application requires access to the private tailnet and a running service computer. Network authentication is provided by Tailscale; this is not public account registration or multi-user data isolation.

Use a private Tailscale Serve HTTPS endpoint forwarding to the verified MRDM localhost port. Do not use Funnel for this single-user deployment. Review tailnet membership and access policies before adding another person. Browser policies may prevent embedding; a separate-window fallback retains the blog page.

Publishing the entry does not deploy or start the Python service. The computer must remain awake and connected. Future multi-user support requires application authentication, per-user data authorization and separate storage before widening network access.
