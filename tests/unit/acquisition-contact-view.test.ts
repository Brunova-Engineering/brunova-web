import { expect, it } from "vitest"
import { contactRows, filterContactRows, type ContactAttempt, type ContactPreparation, type ContactReply } from "@/lib/acquisition-contact-view"
import type { acquisitionApi } from "@/lib/acquisition-api"

type Map = Awaited<ReturnType<typeof acquisitionApi.explorationMap>>

it("keeps Contacto exclusive and never calls a pre-contact selection a positive reply", () => {
  const profile = (
    id: string,
    stage: string,
    methods: number,
    attention = false,
  ) => ({
    companyId: id,
    displayName: id,
    links: [{linkId:`${id}-link`}],
    contactMethods: Array.from({ length: methods }, (_, index) => ({
      methodId: `${id}-${index}`,
    })),
    attention: attention ? { status: "OPEN" } : null,
    enrichment: {
      stage,
      lastTouchedAt: "2026-10-22T12:00:00Z",
      contactedAt: null,
    },
  })
  const map = {
    companyProfiles: [
      profile("still-opportunity", "FILTERING", 1),
      profile("priority", "SELECTED", 1),
      profile("missing-method", "SELECTED", 0),
      profile("sent", "CONTACTED", 1),
      profile("exception", "SELECTED", 0, true),
    ],
  } as unknown as Map
  const rows = contactRows(map)
  expect(rows.map(({ profile }) => profile.companyId)).toEqual([
    "priority",
    "missing-method",
    "sent",
  ])
  expect(
    rows.find(({ profile }) => profile.companyId === "priority")?.phase,
  ).toBe("PRIORITIZED")
  expect(rows.find(({ profile }) => profile.companyId === "sent")?.phase).toBe(
    "CONTACT_UNVERIFIED",
  )
  expect(rows.find(({ profile }) => profile.companyId === "sent")?.decision).toBe(
    "VERIFY_CONTACT",
  )
  expect(
    filterContactRows(rows, "PRIORITIZED", "ADD_METHOD").map(
      ({ profile }) => profile.companyId,
    ),
  ).toEqual(["missing-method"])
})

it("requires a provider receipt before labeling an attempt as sent", () => {
  const map = {companyProfiles:[{companyId:"a",displayName:"A",links:[{linkId:"link-a"}],attention:null,
    contactMethods:[{methodId:"method-a"}],enrichment:{stage:"SELECTED",version:5,lastTouchedAt:null}}]} as unknown as Map
  const attempt = {companyId:"a",linkId:"link-a",methodId:"method-a",stageVersion:5,
    preparationId:"prep-a",intentId:"intent-a",channelType:"EMAIL",authorizedAt:"2026-10-22T00:00:00Z",
    expiresAt:"2026-10-23T00:00:00Z",outcome:null,providerReceiptId:null,outcomeAt:null} as ContactAttempt
  expect(contactRows(map,[],[attempt])[0]?.phase).toBe("AUTHORIZED_PENDING")
  expect(contactRows(map,[],[{...attempt,outcome:"OUTCOME_UNKNOWN"}])[0]?.decision).toBe("RECONCILE_OUTCOME")
  expect(contactRows(map,[],[{...attempt,outcome:"SEND_CONFIRMED"}])[0]?.phase).toBe("OUTCOME_UNKNOWN")
  expect(contactRows(map,[],[{...attempt,outcome:"SEND_CONFIRMED",providerReceiptId:"provider-1"}])[0]?.phase).toBe("SEND_CONFIRMED")
  expect(contactRows(map,[],[{...attempt,methodId:"other"}])[0]?.phase).toBe("PRIORITIZED")
  expect(contactRows(map,[],[{...attempt,stageVersion:4}])[0]?.phase).toBe("PRIORITIZED")
  const contacted={companyProfiles:[{...map.companyProfiles![0],enrichment:{stage:"CONTACTED",version:6}}]} as Map
  expect(contactRows(contacted,[],[{...attempt,outcome:"SEND_CONFIRMED",providerReceiptId:"provider-1"}])[0]?.phase).toBe("SEND_CONFIRMED")
})

it("shows an attributed reply without treating interpretation as a HubSpot write", () => {
  const map={companyProfiles:[{companyId:"a",displayName:"A",links:[{linkId:"link-a"}],attention:null,
    contactMethods:[{methodId:"method-a"}],enrichment:{stage:"CONTACTED",version:6,lastTouchedAt:null}}]} as unknown as Map
  const attempt={companyId:"a",linkId:"link-a",methodId:"method-a",stageVersion:5,
    preparationId:"prep-a",intentId:"intent-a",channelType:"EMAIL",authorizedAt:"2026-10-22T00:00:00Z",
    expiresAt:"2026-10-23T00:00:00Z",outcome:"SEND_CONFIRMED",providerReceiptId:"receipt-a",
    outcomeAt:"2026-10-22T00:01:00Z"} as ContactAttempt
  const reply={companyId:"a",linkId:"link-a",methodId:"method-a",stageVersion:5,
    preparationId:"prep-a",intentId:"intent-a",replyId:"reply-a",channelType:"EMAIL",
    providerMessageId:"message-a",originalText:"Sí, conversemos.",receivedAt:"2026-10-22T00:02:00Z",
    recordedAt:"2026-10-22T00:02:00Z",classification:"POSITIVE",interestSummary:"Quiere conversar.",
    rationale:"El mensaje pide una conversación.",interpretedAt:"2026-10-22T00:03:00Z"} as ContactReply
  expect(contactRows(map,[],[attempt],[reply])[0]?.phase).toBe("REPLY_POSITIVE")
  expect(contactRows(map,[],[attempt],[reply])[0]?.decision).toBe("VERIFY_CRM")
  expect(contactRows(map,[],[attempt],[reply])[0]?.chosenChannel).toBe("EMAIL")
  expect(contactRows(map,[],[attempt],[reply])[0]?.recipientLabel).toBe("A")
  const laterAttempt={...attempt,intentId:"intent-b",channelType:"WHATSAPP",
    authorizedAt:"2026-10-22T00:04:00Z",outcome:"OUTCOME_UNKNOWN"} as ContactAttempt
  expect(contactRows(map,[],[attempt,laterAttempt],[reply])[0]?.chosenChannel).toBe("EMAIL")
  expect(contactRows(map,[],[attempt,laterAttempt],[reply])[0]?.lastActivity).toBe("2026-10-22T00:04:00Z")
  expect(contactRows(map,[],[attempt],[{...reply,classification:"NEGATIVE"}])[0]?.decision).toBe("REVIEW_CLOSURE")
  const returned={...reply,classification:"NEGATIVE",attentionAction:"RETURN_TO_CONTACT",
    attentionDecidedAt:"2026-10-22T00:05:00Z"} as ContactReply
  expect(contactRows(map,[],[attempt],[returned])[0]?.phase).toBe("RETURNED_TO_CONTACT")
  expect(contactRows(map,[],[attempt],[returned])[0]?.decision).toBe("PREPARE_RESPONSE")
  expect(contactRows(map,[],[attempt],[returned])[0]?.lastActivity).toBe("2026-10-22T00:05:00Z")
  expect(contactRows(map,[],[attempt],[{...reply,classification:"OPT_OUT"}])[0]?.decision).toBe("ENFORCE_SUPPRESSION")
  expect(contactRows(map,[],[{...attempt,providerReceiptId:null}],[reply])[0]?.phase).toBe("OUTCOME_UNKNOWN")
  expect(contactRows(map,[],[attempt],[{...reply,intentId:"other"}])[0]?.phase).toBe("SEND_CONFIRMED")
})

it("shows prepared only for an attributed method at the current candidate version", () => {
  const map = {companyProfiles:[{companyId:"a",displayName:"A",links:[{linkId:"link-a"}],attention:null,
    contactMethods:[{methodId:"method-a"}],enrichment:{stage:"SELECTED",version:5,lastTouchedAt:null}}]} as unknown as Map
  const prepared = {companyId:"a",linkId:"link-a",methodId:"method-a",stageVersion:5,
    preparationId:"prep-a",sendAuthorized:false} as ContactPreparation
  expect(contactRows(map,[prepared])[0]?.decision).toBe("REVIEW_PREPARATION")
  expect(contactRows(map,[prepared])[0]?.phase).toBe("PREPARED")
  expect(filterContactRows(contactRows(map,[prepared]),"PREPARED","ALL")).toHaveLength(1)
  expect(contactRows(map,[{...prepared,stageVersion:4}])[0]?.decision).toBe("PREPARE_MESSAGE")
  expect(contactRows(map,[{...prepared,stageVersion:4}])[0]?.phase).toBe("PRIORITIZED")
  expect(contactRows(map,[{...prepared,methodId:"other"}])[0]?.decision).toBe("PREPARE_MESSAGE")
  expect(contactRows(map,[{...prepared,linkId:"other"}])[0]?.decision).toBe("PREPARE_MESSAGE")
})
