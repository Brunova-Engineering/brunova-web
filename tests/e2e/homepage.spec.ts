import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const narrativeHeadings = [
  "When operations become systems problems.",
  "Operational intelligence creates visibility and control across process, data and systems.",
  "What Brunova builds",
  "We don’t start with “What should we automate?” We start with “How should this operation work?”",
  "Selected engineering experience",
  "How Brunova works",
]

test("homepage follows the approved narrative and record counts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/")

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Systems for operations that have outgrown their tools.",
  )

  const levelTwoHeadings = await page
    .getByRole("heading", { level: 2 })
    .allTextContents()
  expect(levelTwoHeadings.map((heading) => heading.trim())).toEqual(
    narrativeHeadings,
  )

  await expect(page.locator(".capability-field-preview__item")).toHaveCount(5)
  await expect(page.locator(".selected-proof article")).toHaveCount(3)
  await expect(page.locator(".selected-proof__reveal-inner > p")).toHaveCount(3)
  await expect(page.locator(".selected-proof")).toHaveJSProperty(
    "tagName",
    "OL",
  )
  await expect(page.locator(".selected-proof > li > a")).toHaveCount(3)
  await expect(
    page
      .locator(".selected-work")
      .getByRole("link", { name: "Explore engineered systems" }),
  ).toHaveCount(1)
  await expect(page.locator(".process-sequence > li")).toHaveCount(4)
  await expect(page.locator(".principles > li")).toHaveCount(3)
  await expect(page.locator(".home-process .principles")).toHaveCount(1)
  await expect(page.locator(".home-differentiators")).toHaveCount(0)
  await expect(
    page
      .locator(".home-process")
      .getByRole("group", { name: "Principles we operate by" }),
  ).toBeVisible()
  await expect(
    page.locator(".home-process").getByRole("heading", { level: 2 }),
  ).toHaveCount(1)
  await expect(
    page.getByRole("img", {
      name: "From fragmented operations to a reliable operational system",
    }),
  ).toBeVisible()
  await expect(page.locator(".home-category")).toContainText(
    "Systems engineering for operations too complex to manage through tools alone.",
  )
  await expect(page.locator(".problem-shift__transition")).toHaveText(
    "The solution is not another tool. It is a better system.",
  )
  await expect(
    page.locator(
      '.home-visual--operational-intelligence img[src="/brand/visuals/operational-intelligence-loop.svg"]',
    ),
  ).toBeVisible()
  await expect(
    page.locator(
      '.home-visual--architecture-boundary img[src="/brand/visuals/architecture-boundary.svg"]',
    ),
  ).toBeVisible()
})

test("selected systems are equal editorial records with progressive disclosure", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto("/")

  const section = page.locator(".selected-work")
  const records = section.locator(".selected-proof__record")
  const reveals = section.locator(".selected-proof__reveal")

  await expect(section.locator(".selected-work__intro > p")).toContainText(
    "Different operational problems",
  )
  await expect(records).toHaveCount(3)
  await expect(records.nth(0)).toHaveAttribute(
    "href",
    "/work/multi-tenant-financial-integration-platform",
  )
  await expect(records.nth(1)).toHaveAttribute(
    "href",
    "/work/operational-finance-data-infrastructure",
  )
  await expect(records.nth(2)).toHaveAttribute(
    "href",
    "/work/document-intelligence-workflow",
  )
  await expect(reveals.nth(0)).toBeHidden()
  await expect(reveals.nth(1)).toBeHidden()
  await expect(reveals.nth(2)).toBeHidden()

  await records.nth(0).focus()
  await expect(reveals.nth(0)).toBeVisible()
  await expect(records.nth(0)).toContainText("View system")

  await records.nth(1).hover()
  await expect(reveals.nth(1)).toBeVisible()
  await expect(records.nth(1)).toContainText("View system")

  await records.nth(2).focus()
  await expect(reveals.nth(2)).toBeVisible()
  await expect(records.nth(2)).toContainText("View system")

  const recordStyles = await records.evaluateAll((links) =>
    links.map((link) => {
      const heading = link.querySelector<HTMLElement>("h3")
      const article = link.querySelector<HTMLElement>("article")

      return {
        fontSize: heading ? getComputedStyle(heading).fontSize : "",
        gap: article ? getComputedStyle(article).gap : "",
        paddingBlock: getComputedStyle(link).paddingBlock,
      }
    }),
  )

  expect(recordStyles[0]).toEqual(recordStyles[1])
})

test("the essential hero content fits the 1280 by 800 fold", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")

  const headerBar = page.locator(".site-header__bar")
  const title = page.getByRole("heading", { level: 1 })
  const description = page.locator(".home-hero__description")
  const primaryAction = page
    .getByRole("main")
    .getByRole("link", { name: "Start a conversation" })
    .first()

  await expect(headerBar).toBeVisible()
  await expect(title).toBeVisible()
  await expect(description).toBeVisible()
  await expect(primaryAction).toBeVisible()

  for (const locator of [title, description, primaryAction]) {
    const box = await locator.boundingBox()
    expect(box).not.toBeNull()
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(800)
  }
})

test("the systems problem section reads as one diagnostic sequence", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/")

  const section = page.locator(".home-problem")
  const failureModes = section.locator(".problem-shift__signals > li")
  await expect(failureModes).toHaveCount(3)
  await expect(section.locator("ol.problem-shift__signals")).toBeVisible()

  const flow = await section.evaluate((node) => {
    const intro = node.querySelector<HTMLElement>(".home-problem__intro")
    const signals = node.querySelector<HTMLElement>(".problem-shift__signals")
    const conclusion = node.querySelector<HTMLElement>(
      ".problem-shift__transition",
    )
    const inner = node.querySelector<HTMLElement>(".home-problem__inner")

    return {
      conclusionAfterSignals:
        Boolean(signals && conclusion) &&
        conclusion!.getBoundingClientRect().top >=
          signals!.getBoundingClientRect().bottom,
      introBeforeSignals:
        Boolean(intro && signals) &&
        intro!.getBoundingClientRect().bottom <=
          signals!.getBoundingClientRect().top,
      sectionColumns: inner ? getComputedStyle(inner).gridTemplateColumns : "",
    }
  })

  expect(flow.introBeforeSignals).toBe(true)
  expect(flow.conclusionAfterSignals).toBe(true)
  expect(flow.sectionColumns.split(" ")).toHaveLength(1)
})

test("operational intelligence reads as concept, explanation and operating model", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto("/")

  const section = page.locator(".operational-intelligence")
  const composition = await section.evaluate((node) => {
    const heading = node.querySelector<HTMLElement>("h2")
    const explanation = node.querySelector<HTMLElement>(
      ".operational-intelligence__statement > p",
    )
    const statement = node.querySelector<HTMLElement>(
      ".operational-intelligence__statement",
    )
    const asset = node.querySelector<HTMLElement>(".home-visual__asset")

    return {
      assetRadius: asset ? getComputedStyle(asset).borderRadius : "",
      explanationOffset:
        heading && explanation
          ? explanation.getBoundingClientRect().top -
            heading.getBoundingClientRect().top
          : 0,
      explanationSize: explanation
        ? Number.parseFloat(getComputedStyle(explanation).fontSize)
        : 0,
      headingSize: heading
        ? Number.parseFloat(getComputedStyle(heading).fontSize)
        : 0,
      explanationBeforeModel:
        Boolean(explanation && asset) &&
        explanation!.getBoundingClientRect().bottom <
          asset!.getBoundingClientRect().top,
      headingBeforeModel:
        Boolean(heading && asset) &&
        heading!.getBoundingClientRect().bottom <
          asset!.getBoundingClientRect().top,
      statementColumns: statement
        ? getComputedStyle(statement).gridTemplateColumns.split(" ").length
        : 0,
    }
  })

  expect(composition.headingBeforeModel).toBe(true)
  expect(composition.explanationBeforeModel).toBe(true)
  expect(Math.abs(composition.explanationOffset)).toBeLessThanOrEqual(2)
  expect(composition.explanationSize).toBeLessThan(composition.headingSize)
  expect(composition.statementColumns).toBe(12)
  expect(composition.assetRadius).toBe("0px")

  const assetResponse = await page.request.get(
    "/brand/visuals/operational-intelligence-loop.svg",
  )
  const assetMarkup = await assetResponse.text()
  expect(assetMarkup).not.toContain('id="bg"')
  expect(assetMarkup).not.toContain('width="718"')
  expect(assetMarkup).toContain("Automation · Software · AI")
})

test("capabilities read as disciplines supporting one operational system", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/")

  const section = page.locator(".home-capabilities")
  const model = section.locator(".capability-field-preview")
  const disciplines = model.locator(".capability-field-preview__disciplines")

  await expect(section.locator(".home-capabilities__intro > p")).toHaveText(
    "Five engineering disciplines Brunova integrates into one operational system.",
  )
  await expect(model.locator(".capability-field-preview__core")).toHaveText(
    "One operational system",
  )
  await expect(disciplines.locator("li")).toHaveCount(5)
  await expect(
    section.getByRole("link", { name: "Explore capabilities" }),
  ).toHaveCount(1)

  const desktop = await model.evaluate((node) => {
    const core = node.querySelector<HTMLElement>(
      ".capability-field-preview__core",
    )
    const disciplineList = node.querySelector<HTMLElement>(
      ".capability-field-preview__disciplines",
    )
    const items = Array.from(
      node.querySelectorAll<HTMLElement>(".capability-field-preview__item"),
    )
    const modelRect = node.getBoundingClientRect()
    const coreRect = core?.getBoundingClientRect()
    const largestItemArea = Math.max(
      ...items.map((item) => {
        const rect = item.getBoundingClientRect()
        return rect.width * rect.height
      }),
    )

    return {
      borderWidth: Number.parseFloat(getComputedStyle(node).borderTopWidth),
      coreHeight: coreRect?.height ?? 0,
      coreBeforeDisciplines:
        Boolean(core && disciplineList) &&
        Boolean(
          core!.compareDocumentPosition(disciplineList!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      coreToItemArea:
        coreRect && largestItemArea
          ? (coreRect.width * coreRect.height) / largestItemArea
          : 0,
      disciplineColumns: disciplineList
        ? getComputedStyle(disciplineList).gridTemplateColumns.split(" ").length
        : 0,
      disciplineWidthRatio: disciplineList
        ? disciplineList.getBoundingClientRect().width / modelRect.width
        : 0,
      modelHeight: modelRect.height,
    }
  })

  expect(desktop.coreBeforeDisciplines).toBe(true)
  expect(desktop.coreToItemArea).toBeGreaterThan(4)
  expect(desktop.coreHeight).toBeLessThan(160)
  expect(desktop.disciplineColumns).toBe(5)
  expect(desktop.disciplineWidthRatio).toBeGreaterThan(0.85)
  expect(desktop.modelHeight).toBeLessThan(340)
  expect(desktop.borderWidth).toBeGreaterThan(0)

  await model.scrollIntoViewIfNeeded()
  await expect(model).toHaveAttribute("data-revealed", "true")

  const motion = await model.evaluate((node) => {
    const disciplineList = node.querySelector<HTMLElement>(
      ".capability-field-preview__disciplines",
    )
    const firstHeading = node.querySelector<HTMLElement>(
      ".capability-field-preview__item .heading--3",
    )

    return {
      connectionAnimation: disciplineList
        ? getComputedStyle(disciplineList, "::after").animationName
        : "",
      disciplineAnimation: firstHeading
        ? getComputedStyle(firstHeading).animationName
        : "",
    }
  })

  expect(motion.connectionAnimation).toBe("capability-connection-flow")
  expect(motion.disciplineAnimation).toBe("capability-discipline-arrival")

  await page.setViewportSize({ width: 390, height: 844 })

  const mobile = await disciplines.evaluate((node) => {
    const itemTops = Array.from(node.children, (item) =>
      Math.round(item.getBoundingClientRect().top),
    )

    return {
      columns: getComputedStyle(node).gridTemplateColumns.split(" ").length,
      rows: new Set(itemTops).size,
      overflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    }
  })

  expect(mobile.columns).toBe(2)
  expect(mobile.rows).toBe(3)
  expect(mobile.overflow).toBe(0)

  await page.emulateMedia({ reducedMotion: "reduce" })

  const reducedMotion = await model.evaluate((node) => {
    const disciplineList = node.querySelector<HTMLElement>(
      ".capability-field-preview__disciplines",
    )
    const firstHeading = node.querySelector<HTMLElement>(
      ".capability-field-preview__item .heading--3",
    )

    return {
      connectionAnimation: disciplineList
        ? getComputedStyle(disciplineList, "::after").animationName
        : "",
      disciplineAnimation: firstHeading
        ? getComputedStyle(firstHeading).animationName
        : "",
    }
  })

  expect(reducedMotion.connectionAnimation).toBe("none")
  expect(reducedMotion.disciplineAnimation).toBe("none")
})

test("architecture before tools reads as principle, boundary and capability", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/")

  const section = page.locator(".architecture-hinge")
  const composition = await section.evaluate((node) => {
    const inner = node.querySelector<HTMLElement>(".architecture-hinge__inner")
    const heading = node.querySelector<HTMLElement>("h2")
    const asset = node.querySelector<HTMLElement>(".home-visual__asset")

    return {
      assetToHeadingWidth:
        heading && asset
          ? asset.getBoundingClientRect().width /
            heading.getBoundingClientRect().width
          : 0,
      columns: inner
        ? getComputedStyle(inner).gridTemplateColumns.split(" ").length
        : 0,
      radius: asset ? getComputedStyle(asset).borderRadius : "",
      surface: getComputedStyle(node).backgroundColor,
    }
  })

  expect(composition.columns).toBe(2)
  expect(composition.assetToHeadingWidth).toBeGreaterThan(2)
  expect(composition.radius).toBe("0px")
  expect(composition.surface).not.toBe("rgba(0, 0, 0, 0)")

  const assetResponse = await page.request.get(
    "/brand/visuals/architecture-boundary.svg",
  )
  const assetMarkup = await assetResponse.text()
  expect(assetMarkup).not.toContain("<circle")
  expect(assetMarkup).not.toContain("linearGradient")
  expect(assetMarkup).not.toContain("<filter")
  expect(assetMarkup).not.toContain('rx="')
  expect(assetMarkup.indexOf("OPERATIONAL CONTEXT")).toBeLessThan(
    assetMarkup.indexOf("DEFINED OPERATING MODEL"),
  )
  expect(assetMarkup.indexOf("DEFINED OPERATING MODEL")).toBeLessThan(
    assetMarkup.indexOf("Operational capability"),
  )
  expect(assetMarkup.indexOf("Operational capability")).toBeLessThan(
    assetMarkup.indexOf("Automation"),
  )

  await page.setViewportSize({ width: 390, height: 844 })
  const mobileAsset = section.locator(".home-visual__asset")
  await expect(mobileAsset).toBeVisible()
  await expect(section.locator(".home-visual__mobile")).toHaveCount(0)
  await expect(section.locator(".home-visual__media source")).toHaveAttribute(
    "srcset",
    "/brand/visuals/architecture-boundary-mobile.svg",
  )

  const mobile = await section.evaluate((node) => {
    const heading = node.querySelector<HTMLElement>("h2")
    const model = node.querySelector<HTMLElement>(".home-visual__media")

    return {
      headingBeforeModel:
        Boolean(heading && model) &&
        heading!.getBoundingClientRect().bottom <=
          model!.getBoundingClientRect().top,
      overflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    }
  })

  expect(mobile.headingBeforeModel).toBe(true)
  expect(mobile.overflow).toBe(0)
})

test("intermediate positioning and system conclusion remain aligned", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/")

  const typography = await page.evaluate(() => {
    const lineCount = (element: Element | null) => {
      if (!element) return 0
      const range = document.createRange()
      range.selectNodeContents(element)
      return range.getClientRects().length
    }
    const category = document.querySelector(".home-category p")
    const conclusion = document.querySelector(".problem-shift__transition")
    const categoryRect = category?.getBoundingClientRect()
    const categoryParentRect = category?.parentElement?.getBoundingClientRect()

    return {
      categoryAlignment: category ? getComputedStyle(category).textAlign : "",
      categoryCenterDelta:
        categoryRect && categoryParentRect
          ? Math.abs(
              categoryRect.left +
                categoryRect.width / 2 -
                (categoryParentRect.left + categoryParentRect.width / 2),
            )
          : Number.POSITIVE_INFINITY,
      categoryLines: lineCount(category),
      conclusionAlignment: conclusion
        ? getComputedStyle(conclusion).textAlign
        : "",
      conclusionLines: lineCount(conclusion),
    }
  })

  expect(typography.categoryAlignment).toBe("center")
  expect(typography.categoryCenterDelta).toBeLessThanOrEqual(1)
  expect(typography.categoryLines).toBeGreaterThanOrEqual(1)
  expect(typography.categoryLines).toBeLessThanOrEqual(2)
  expect(typography.conclusionLines).toBeGreaterThanOrEqual(1)
  expect(typography.conclusionLines).toBeLessThanOrEqual(2)
  expect(typography.conclusionAlignment).toBe("end")
})

for (const state of [
  { name: "desktop light", width: 1440, height: 1000, theme: "light" },
  { name: "desktop dark", width: 1440, height: 1000, theme: "dark" },
  { name: "mobile light", width: 390, height: 844, theme: "light" },
  { name: "mobile dark", width: 390, height: 844, theme: "dark" },
] as const) {
  test(`homepage has no detectable accessibility violations in ${state.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: state.width, height: state.height })
    await page.addInitScript((theme) => {
      window.localStorage.setItem("brunova-theme", theme)
    }, state.theme)
    await page.goto("/")

    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      state.theme,
    )
    const accessibility = await new AxeBuilder({ page }).analyze()
    expect(accessibility.violations).toEqual([])
  })
}

test("mobile uses the approved responsive hero asset and honors reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")

  const heroAsset = page.locator(".home-visual--hero .home-visual__asset")
  await expect(heroAsset).toBeVisible()
  expect(
    await heroAsset.evaluate((image: HTMLImageElement) => image.currentSrc),
  ).toContain("/brand/visuals/hero-operating-model-mobile.svg")
  await expect(page.locator(".home-visual__mobile")).toHaveCount(0)

  const primaryAction = page
    .getByRole("main")
    .getByRole("link", { name: "Start a conversation" })
    .first()
  await primaryAction.focus()
  await expect(primaryAction).toBeFocused()
  expect(
    await primaryAction.evaluate(
      (element) => window.getComputedStyle(element).outlineStyle,
    ),
  ).not.toBe("none")

  const animations = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((animation) => animation.playState === "running").length,
  )
  expect(animations).toBe(0)
})

for (const width of [320, 375, 390, 414, 768]) {
  test(`homepage preserves meaning without horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(width % 2 === 0 ? "/es" : "/")

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    await expect(page.locator(".home-visual__asset")).toHaveCount(3)
    expect(
      await page
        .locator(".home-visual__asset")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              getComputedStyle(image).display !== "none" &&
              image.getBoundingClientRect().width > 0,
          ),
        ),
    ).toBe(true)
    await expect(page.locator(".home-visual__mobile")).toHaveCount(0)
    const sources = await page
      .locator(".home-visual__media source")
      .evaluateAll((elements) =>
        elements.map((source) => source.getAttribute("srcset") ?? ""),
      )
    for (const source of sources) {
      expect(source).toContain("-mobile")
    }
    await expect(page.locator(".process-sequence > li")).toHaveCount(4)
  })
}

test("Spanish homepage selects the approved Spanish visual assets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/es")

  await expect(page.locator(".home-visual--hero img")).toHaveAttribute(
    "src",
    "/brand/visuals/hero-operating-model-es.svg",
  )
  await expect(
    page.locator(".home-visual--operational-intelligence img"),
  ).toHaveAttribute(
    "src",
    "/brand/visuals/operational-intelligence-loop-es.svg",
  )
  await expect(
    page.locator(".home-visual--architecture-boundary img"),
  ).toHaveAttribute("src", "/brand/visuals/architecture-boundary-es.svg")

  const spanishAssetPaths = [
    "/brand/visuals/hero-operating-model-es.svg",
    "/brand/visuals/operational-intelligence-loop-es.svg",
    "/brand/visuals/architecture-boundary-es.svg",
    "/brand/visuals/hero-operating-model-mobile-es.svg",
    "/brand/visuals/operational-intelligence-loop-mobile-es.svg",
    "/brand/visuals/architecture-boundary-mobile-es.svg",
  ]
  const spanishAssetMarkup = await Promise.all(
    spanishAssetPaths.map(async (path) => {
      const response = await page.request.get(path)
      expect(response.ok()).toBe(true)
      return response.text()
    }),
  )
  const architectureMarkup = spanishAssetMarkup[2]

  expect(architectureMarkup).toContain("MODELO OPERATIVO DEFINIDO")
  expect(architectureMarkup).toContain("Gobernanza")
  expect(architectureMarkup).not.toContain("LÍMITE DEL SISTEMA")

  for (const markup of spanishAssetMarkup) {
    expect(markup).toContain("Gobernanza")
    expect(markup).not.toContain("Responsables")
    expect(markup).not.toContain("Propiedad")
  }

  await page.setViewportSize({ width: 390, height: 844 })
  const mobileSources = await page
    .locator(".home-visual__media source")
    .evaluateAll((elements) =>
      elements.map((source) => source.getAttribute("srcset") ?? ""),
    )
  expect(mobileSources).toEqual(
    expect.arrayContaining([
      expect.stringContaining("hero-operating-model-mobile-es.svg"),
      expect.stringContaining("operational-intelligence-loop-mobile-es.svg"),
      expect.stringContaining("architecture-boundary-mobile-es.svg"),
    ]),
  )
})

test("forbidden feedback-loop copy is absent from public homepage sources", async ({
  page,
}) => {
  const forbidden = [
    ["The operational state", "returns to the model."].join(" "),
    ["El estado operativo", "vuelve al modelo."].join(" "),
  ]
  const paths = [
    "/",
    "/es",
    "/brand/visuals/operational-intelligence-loop.svg",
    "/brand/visuals/operational-intelligence-loop-es.svg",
    "/brand/visuals/operational-intelligence-loop-mobile.svg",
    "/brand/visuals/operational-intelligence-loop-mobile-es.svg",
  ]

  for (const path of paths) {
    const response = await page.request.get(path)
    const body = await response.text()
    for (const sentence of forbidden) expect(body).not.toContain(sentence)
  }
})

test("Spanish homepage uses the approved operating-model language", async ({
  page,
}) => {
  await page.goto("/es")

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sistemas para operaciones que han crecido más allá de sus herramientas.",
  )
  await expect(page.locator(".home-hero__description")).toHaveText(
    "Brunova diseña y construye sistemas operacionales confiables que integran procesos, datos y automatizaciones hoy fragmentados, para que operaciones complejas puedan crecer con control.",
  )

  const problem = page.locator(".home-problem")
  await expect(problem.locator(".home-problem__intro > p")).toHaveText(
    "El crecimiento revela problemas que ninguna herramienta aislada puede resolver: la operación necesita un sistema detrás.",
  )
  await expect(problem.getByText("Transferencias manuales")).toBeVisible()
  await expect(problem).toContainText(
    "El estado y la responsabilidad se diluyen entre equipos, dificultando el control de entregas y excepciones.",
  )

  const operationalIntelligence = page.locator(".operational-intelligence")
  await expect(
    operationalIntelligence.getByRole("heading", { level: 2 }),
  ).toHaveText(
    "La inteligencia operativa aporta visibilidad y control sobre procesos, datos y sistemas.",
  )
  await expect(
    operationalIntelligence.locator(".operational-intelligence__statement > p"),
  ).toHaveText(
    "Conectamos cómo fluye el trabajo, qué significan los datos y dónde se toman las decisiones, para que los equipos entiendan mejor la operación y actúen con mayor control. El software, la automatización y la IA apoyan ese modelo donde pueden hacerlo de forma segura.",
  )

  const statementAlignment = await operationalIntelligence
    .locator(".operational-intelligence__statement")
    .evaluate((node) => {
      const heading = node.querySelector<HTMLElement>("h2")
      const explanation = node.querySelector<HTMLElement>("p")

      return heading && explanation
        ? Math.abs(
            heading.getBoundingClientRect().top -
              explanation.getBoundingClientRect().top,
          )
        : Number.POSITIVE_INFINITY
    })

  expect(statementAlignment).toBeLessThanOrEqual(2)

  const capabilities = page.locator(".home-capabilities")
  await expect(
    capabilities.locator(".home-capabilities__intro > p"),
  ).toHaveText(
    "Cinco disciplinas de ingeniería que Brunova integra en un sistema operacional.",
  )
  await expect(
    capabilities.locator(".capability-field-preview__core"),
  ).toHaveText("Un sistema operacional")

  const selectedSystems = page.locator(".selected-work")
  await expect(selectedSystems.getByRole("heading", { level: 2 })).toHaveText(
    "Experiencia de ingeniería seleccionada",
  )
  await expect(
    selectedSystems.locator(".selected-proof__reveal-inner > p").nth(1),
  ).toHaveText(
    "Flujos automatizados de extracción y reporte conectan sistemas contables y operativos con un almacén de datos y las hojas de cálculo que usan los equipos, para dar acceso consistente a la información financiera.",
  )
  await expect(
    selectedSystems.getByRole("link", {
      name: "Explorar sistemas diseñados y construidos",
    }),
  ).toBeVisible()

  const process = page.locator(".home-process")
  await expect(process.locator(".home-section-intro > p")).toHaveText(
    "Un enfoque que parte del estado real del sistema, no de una secuencia rígida.",
  )
  await expect(
    process.getByText("Sistemas, no automatizaciones aisladas."),
  ).toBeVisible()
})
