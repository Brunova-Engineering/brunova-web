export const privacyContent = {
  reviewStatus: "approved-controller-information-2026-08-25",
  updatedLabel:
    "Privacy Notice · Effective August 24, 2026 · Last updated August 25, 2026",
  introduction:
    "This integral Privacy Notice explains how Jorge Alfredo Vera Fuentes, operating as Brunova, handles personal data collected through the Brunova website.",
  sections: [
    {
      id: "controller",
      title: "Data controller",
      paragraphs: [
        "Jorge Alfredo Vera Fuentes, an individual established in Mexico and trading under the commercial name Brunova, is responsible for processing personal data through this website.",
        "Privacy domicile: Calle Poniente 1 #16, Centro, 94730 Río Blanco, Veracruz, Mexico. Privacy contact: brunova@brunova.mx.",
      ],
    },
    {
      id: "data-collected",
      title: "Personal data collected",
      paragraphs: [
        "The contact form collects your name, work email, company, role, problem category and the description you provide about an operational problem. It also includes the page path and language of the submission, a request identifier, an idempotency identifier and the submission time.",
        "During one uninterrupted page visit, the website keeps a limited first-touch record in temporary page memory: landing path and language, capture time, referring hostname when available, a limited source classification and source, medium, campaign, term and content UTM values supplied in the landing URL. The full referring URL and its query string are not retained. The record is not written to cookies, localStorage or sessionStorage and is lost when the page is reloaded or closed. Under the currently deployed contact contract, only available UTM values—not the remaining first-touch fields—are included with a contact submission.",
        "The website uses a raw network address only transiently to derive a pseudonymous, in-memory abuse-control key. The raw address, honeypot value and form timing information are not retained in Brunova's operational workflow, and the website does not create a browser fingerprint.",
        "Brunova does not intentionally request sensitive personal data. Please do not include health, biometric, genetic, religious, political, sexual-orientation or other sensitive personal information in the free-text description.",
      ],
    },
    {
      id: "purposes",
      title: "Purposes of processing",
      paragraphs: [
        "Brunova uses submitted information only to review an inquiry and its business context; determine whether Brunova is an appropriate fit and what next step may be useful; respond to the inquiry; maintain necessary operational and commercial follow-up; preserve necessary business correspondence; and maintain reasonable records related to the commercial relationship or potential relationship.",
        "Technical request information is processed only as necessary to operate and secure the website, validate submissions, prevent abuse, maintain request integrity and diagnose delivery failures without logging contact-form payloads.",
        "There are no secondary purposes. Brunova does not currently use submitted information for newsletters, advertising campaigns, behavioral advertising, profiling or unrelated promotional mailings. A new purpose outside this Notice will require a prior privacy review and, where required, renewed consent.",
      ],
    },
    {
      id: "processing",
      title: "Processing and service providers",
      paragraphs: [
        "The browser sends the contact form to Brunova's server. The server validates and limits the submission before forwarding only the accepted contact fields and available UTM values to Brunova's private operational workflow for internal review and follow-up.",
        "Technology and service providers may process personal data on Brunova's behalf when necessary to provide website hosting, communications, workflow automation and business-system services. Depending on their infrastructure, processing or storage may occur in Mexico or other countries. Brunova does not represent that processing occurs exclusively in Mexico.",
        "Brunova does not currently intend to disclose personal data to independent third parties for their own purposes. If a future transfer requires notice or consent under applicable law, Brunova will provide it before that transfer occurs.",
      ],
    },
    {
      id: "retention",
      title: "Retention and disposal",
      paragraphs: [
        "For an inquiry that does not become a client relationship, Brunova's operational policy is to retain the information for no more than 24 months after the last meaningful commercial interaction, unless a longer period is necessary for an applicable legal obligation or a legitimate dispute or record requirement. The 24-month period is Brunova's policy; it is not a statutory Mexican retention period.",
        "For an inquiry that becomes a client relationship, personal data is retained for the duration of the commercial or contractual relationship and afterward only for the periods required by applicable legal, contractual, fiscal, accounting, dispute-resolution or other legitimate recordkeeping obligations.",
        "When the applicable purpose and retention or blocking period ends, Brunova will delete, securely dispose of, anonymize or disassociate the information as appropriate. A legally required blocking period may apply before deletion.",
      ],
    },
    {
      id: "rights",
      title: "ARCO rights, limitation and revocation",
      paragraphs: [
        "You may request access to, rectification or cancellation of your personal data, or object to its processing (ARCO rights), by emailing brunova@brunova.mx. You may use the same address to limit use or disclosure or to revoke consent. Revocation does not have retroactive effects and may be subject to applicable legal retention requirements.",
        "The request should include your name; an address or another method for receiving notices; documentation reasonably necessary to verify your identity or, where applicable, the identity and authority of your representative; a clear description of the personal data involved; the ARCO right or requested action; and any information reasonably useful for locating the data. A rectification request should also identify the requested correction and include supporting documentation where appropriate.",
        "Brunova will acknowledge the request by email. A determination will be communicated within the statutory maximum of 20 business days after receipt. If the request is granted, it will be made effective within the following 15 business days. Either period may be extended once for an equal period when the circumstances justify it. The response will be sent by email or by the communication method supplied by the requester. ARCO requests are free, except for legally permitted reproduction, copying or delivery costs.",
      ],
    },
    {
      id: "preferences",
      title: "Preferences, analytics and advertising",
      paragraphs: [
        "Browser local storage is used only after you choose an appearance or language preference, so the site can provide that requested setting. The website does not currently set cookies.",
        "The current website uses a no-operation analytics adapter and includes no analytics provider, advertising tracker or behavioral advertising. No non-essential analytics or advertising storage is active, so no consent banner is shown.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this Notice",
      paragraphs: [
        "The current versions of this Notice are published at /privacy and /es/privacy. Changes will be communicated by publishing the updated Notice at those addresses with a revised date. If applicable law requires an additional form of notice or consent for a specific material change, Brunova will provide it at that time.",
        "This Notice was first published with the production website on August 24, 2026. This approved revision was last updated on August 25, 2026.",
      ],
    },
  ],
} as const
