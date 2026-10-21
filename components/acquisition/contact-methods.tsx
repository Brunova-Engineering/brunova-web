export type ContactMethod = {
  methodId: string
  channelType: string
  channelValue: string
  contactName?: string | null
  sourceUrl: string
  attribution: string
}

function safeSource(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" ? url.href : null
  } catch {
    return null
  }
}

export function ContactMethods({
  methods,
  companyName,
  locale,
}: {
  methods: ContactMethod[]
  companyName: string
  locale: "es" | "en"
}) {
  return (
    <>
      <div className="acq-contact-overview-heading">
        <div>
          <strong>
            {locale === "es" ? "Medios acreditados" : "Verified methods"}
          </strong>
          <p className="acq-muted">
            {locale === "es"
              ? "Datos publicados y atribuidos a esta empresa; sin contacto realizado."
              : "Published methods attributed to this company; no outreach sent."}
          </p>
        </div>
        <span>{methods.length}</span>
      </div>
      {methods.length ? (
        <ul className="acq-contact-method-list">
          {methods.map((method) => (
            <li key={method.methodId}>
              <div className="acq-contact-method-main">
                <span className="acq-contact-channel">
                  {method.channelType === "EMAIL"
                    ? "Email"
                    : method.channelType === "LINKEDIN"
                      ? "LinkedIn"
                      : method.channelType === "WHATSAPP"
                        ? "WhatsApp"
                        : method.channelType === "FACEBOOK"
                          ? "Facebook"
                          : method.channelType === "INSTAGRAM"
                            ? "Instagram"
                            : method.channelType}
                </span>
                <strong>{method.contactName?.trim() || companyName}</strong>
              </div>
              <div className="acq-contact-method-meta">
                <span>{method.channelValue}</span>
                {safeSource(method.sourceUrl) && (
                  <a
                    href={safeSource(method.sourceUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {locale === "es" ? "Fuente" : "Source"}
                  </a>
                )}
              </div>
              <details>
                <summary>
                  {locale === "es" ? "Atribución" : "Attribution"}
                </summary>
                <p>{method.attribution}</p>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className="acq-muted">
          {locale === "es"
            ? "Aún no hay un medio acreditado."
            : "No verified method yet."}
        </p>
      )}
    </>
  )
}
