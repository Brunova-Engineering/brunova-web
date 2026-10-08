"use client"

import { useCallback, useEffect, useState } from "react"
import {
  acquisitionApi,
  type CrmBoundary,
  type PortalSession,
} from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

export function CrmBoundarySection({
  cycleId,
  accountId,
  session,
  locale,
}: {
  cycleId: string
  accountId: string
  session: PortalSession
  locale: Locale
}) {
  const es = locale === "es"
  const [rows, setRows] = useState<CrmBoundary[] | null>(null)
  const [error, setError] = useState(false),
    [pending, setPending] = useState(false)
  const [reason, setReason] = useState("")
  const [command, setCommand] = useState<{ key: string; id: string } | null>(
    null,
  )
  const load = useCallback(async () => {
    try {
      const result = await acquisitionApi.crm(cycleId, accountId)
      setRows(result.items)
      setError(false)
    } catch {
      setError(true)
      setRows(null)
    }
  }, [cycleId, accountId])
  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) void load()
    })
    return () => {
      cancelled = true
    }
  }, [load])
  const labels: Record<string, string> = es
    ? {
        READY: "Pendiente",
        IN_PROGRESS: "En proceso",
        SYNCED: "Sincronizado",
        RECONCILIATION_REQUIRED: "Requiere reconciliación",
        BLOCKED: "Bloqueado",
        RECOMMENDED: "Listo para aceptación",
        MANAGEMENT_REVIEW: "Revisión de Management",
        ACCEPTED: "Aceptado",
        DECLINED: "No recomendado",
        INTERESTED: "Interés expresado",
        QUESTION: "Pregunta",
        UNKNOWN: "Respuesta sin clasificar",
      }
    : {
        READY: "Pending",
        IN_PROGRESS: "In progress",
        SYNCED: "Synced",
        RECONCILIATION_REQUIRED: "Needs reconciliation",
        BLOCKED: "Blocked",
        RECOMMENDED: "Ready for acceptance",
        MANAGEMENT_REVIEW: "Management review",
        ACCEPTED: "Accepted",
        DECLINED: "Declined",
        INTERESTED: "Expressed interest",
        QUESTION: "Question",
        UNKNOWN: "Unclassified response",
      }
  async function act(operation: string, request: Record<string, unknown>) {
    const key = JSON.stringify({ operation, request })
    if (pending) return
    const next =
      command?.key === key ? command : { key, id: crypto.randomUUID() }
    setCommand(next)
    setPending(true)
    try {
      await acquisitionApi.crmCommand(
        operation,
        next.id,
        request,
        session.csrfToken,
      )
      setCommand(null)
      await load()
    } catch {
      setError(true)
      await load()
      setError(true)
    } finally {
      setPending(false)
    }
  }
  const manage = session.actor.capabilities.includes("MANAGE_CRM_BOUNDARY")
  return (
    <section className="acq-panel" aria-label="CRM">
      <h3>CRM</h3>
      {error && (
        <p role="alert">
          {es
            ? "No se confirmó la operación o lectura. Revisa el estado vigente antes de continuar."
            : "The operation or read was not confirmed. Review current state before continuing."}
        </p>
      )}
      {rows === null && !error && (
        <p role="status">{es ? "Consultando CRM…" : "Loading CRM…"}</p>
      )}
      {rows?.length === 0 && (
        <p>
          {es ? "Sin sincronización CRM registrada." : "No CRM sync recorded."}
        </p>
      )}
      <button disabled={pending} onClick={() => void load()}>
        {es ? "Actualizar CRM" : "Refresh CRM"}
      </button>
      {manage && rows?.length === 0 && (
        <button
          disabled={pending}
          onClick={() =>
            void act("REQUEST_PRE_OUTBOUND_SYNC", { cycleId, accountId })
          }
        >
          {es
            ? "Solicitar sincronización controlada"
            : "Request controlled sync"}
        </button>
      )}
      {rows?.map((row) => (
        <div key={row.intent_id}>
          <p>{labels[row.status] ?? row.status}</p>
          <dl>
            <dt>Company</dt>
            <dd>
              {row.company_id
                ? row.company_name
                : es
                  ? "Sin mapeo"
                  : "Not mapped"}
            </dd>
            <dt>Contact</dt>
            <dd>
              {row.contact_id
                ? row.contact_name
                : es
                  ? "Sin mapeo"
                  : "Not mapped"}
            </dd>
            <dt>{es ? "Asociación" : "Association"}</dt>
            <dd>
              {row.association_observed
                ? es
                  ? "Observada"
                  : "Observed"
                : es
                  ? "No confirmada"
                  : "Not confirmed"}
            </dd>
          </dl>
          <h4>{es ? "Handoff comercial" : "Commercial handoff"}</h4>
          <p>
            {row.authority === "HUBSPOT_HUMAN_COMMERCIAL"
              ? es
                ? "HubSpot · seguimiento comercial Humano"
                : "HubSpot · Human commercial follow-up"
              : es
                ? "Acquisition · previo al handoff"
                : "Acquisition · before handoff"}
          </p>
          {!row.handoffs.length && (
            <p>{es ? "Sin handoff registrado." : "No handoff recorded."}</p>
          )}
          {row.handoffs.map((h) => (
            <div key={h.handoffId}>
              <p>
                {labels[h.status] ?? h.status} · {labels[h.reason] ?? h.reason}
              </p>
              {manage && !h.accepted && h.status === "RECOMMENDED" && (
                <button
                  disabled={pending || !reason.trim()}
                  onClick={() =>
                    void act("ACCEPT_COMMERCIAL_HANDOFF", {
                      handoffId: h.handoffId,
                      reason,
                    })
                  }
                >
                  {es ? "Aceptar handoff" : "Accept handoff"}
                </button>
              )}
              {manage &&
                h.status === "MANAGEMENT_REVIEW" &&
                ["RECOMMEND", "DECLINE"].map((decision) => (
                  <button
                    key={decision}
                    disabled={pending || !reason.trim()}
                    onClick={() =>
                      void act("REVIEW_COMMERCIAL_HANDOFF", {
                        handoffId: h.handoffId,
                        decision,
                        reason,
                      })
                    }
                  >
                    {decision === "RECOMMEND"
                      ? es
                        ? "Recomendar handoff"
                        : "Recommend handoff"
                      : es
                        ? "No recomendar"
                        : "Decline"}
                  </button>
                ))}
            </div>
          ))}
          {manage &&
            ["RECONCILIATION_REQUIRED", "BLOCKED"].includes(row.status) && (
              <button
                disabled={pending}
                onClick={() =>
                  void act("REQUEST_CRM_RECONCILIATION", {
                    intentId: row.intent_id,
                    expectedVersion: row.version,
                  })
                }
              >
                {es ? "Solicitar reconciliación" : "Request reconciliation"}
              </button>
            )}
          <details>
            <summary>{es ? "Detalle técnico" : "Technical details"}</summary>
            <p>{row.reason}</p>
            <p>
              Company: {row.company_id ?? "—"} · Contact:{" "}
              {row.contact_id ?? "—"}
            </p>
            <p>{row.intent_id}</p>
          </details>
        </div>
      ))}
      {manage && !!rows?.some((r) => r.handoffs.some((h) => !h.accepted)) && (
        <label>
          {es ? "Motivo de la decisión" : "Decision reason"}
          <textarea
            value={reason}
            maxLength={1000}
            disabled={pending}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
      )}
      <p className="acq-muted">
        {es
          ? "No crea Deals ni autoriza envíos. Email de producción sigue deshabilitado."
          : "Does not create Deals or authorize sends. Production Email remains disabled."}
      </p>
    </section>
  )
}
