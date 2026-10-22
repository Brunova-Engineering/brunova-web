export type ContactMethod = {
  methodId: string
  channelType: string
  channelValue: string
  contactName?: string | null
  sourceUrl: string
  attribution: string
}

export type WhatsAppCheck = {
  checkId: string
  normalizedNumber: string
  sourceUrl: string
  outcome: "EXISTS" | "NOT_FOUND" | "UNAVAILABLE"
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
  checks = [],
  companyName,
  locale,
  hasContactRecord = false,
  receiptConfirmed = false,
  sentMethodId,
}: {
  methods: ContactMethod[]
  checks?: WhatsAppCheck[]
  companyName: string
  locale: "es" | "en"
  hasContactRecord?: boolean
  receiptConfirmed?: boolean
  sentMethodId?: string
}) {
  const visibleChecks = checks.filter(
    (check) =>
      check.outcome !== "EXISTS" ||
      !methods.some(
        (method) =>
          method.channelType === "WHATSAPP" &&
          method.channelValue.replace(/\D/g, "") === check.normalizedNumber,
      ),
  )
  return (
    <>
      <div className="acq-contact-overview-heading">
        <div>
          <strong>
            {locale === "es" ? "Medios acreditados" : "Verified methods"}
          </strong>
          <p className="acq-muted">
            {receiptConfirmed
              ? locale === "es"
                ? "El envío tiene recibo confirmado; estos son los medios atribuidos."
                : "The send has a confirmed receipt; these are the attributed methods."
              : hasContactRecord
              ? locale === "es"
                ? "La ficha registra contacto; el recibo del envío aún no está disponible aquí."
                : "Contact is recorded; the send receipt is not available here yet."
              : locale === "es"
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
              <p className="acq-muted">
                {sentMethodId === method.methodId
                  ? locale === "es" ? "Medio del envío confirmado" : "Method used for the confirmed send"
                  : locale === "es" ? "Medio atribuido · envío automático no habilitado" : "Attributed method · automatic sending not enabled"}
              </p>
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
      {visibleChecks.length > 0 && (
        <div className="acq-contact-checks">
          <strong>{locale === "es" ? "Números comprobados" : "Checked numbers"}</strong>
          <ul className="acq-contact-method-list">
            {visibleChecks.map((check) => (
              <li key={check.checkId}>
                <div className="acq-contact-method-main">
                  <span className="acq-contact-channel">
                    {check.outcome === "EXISTS"
                      ? "WhatsApp"
                      : locale === "es" ? "Número publicado" : "Published number"}
                  </span>
                  <strong>{check.normalizedNumber}</strong>
                </div>
                <div className="acq-contact-method-meta">
                  <span>
                    {check.outcome === "EXISTS"
                      ? locale === "es" ? "Disponible; medio por registrar" : "Available; method to record"
                      : check.outcome === "NOT_FOUND"
                        ? locale === "es" ? "No figura en WhatsApp" : "Not on WhatsApp"
                        : locale === "es" ? "Comprobación pendiente" : "Check pending"}
                  </span>
                  {safeSource(check.sourceUrl) && (
                    <a href={safeSource(check.sourceUrl)!} target="_blank" rel="noopener noreferrer">
                      {locale === "es" ? "Fuente" : "Source"}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
