import { AnalyticsLink } from "@/components/analytics/analytics-link"
import { BrunovaLogo } from "@/components/brand/brunova-logo"
import { ActiveNavigationLink } from "@/components/layout/active-navigation-link"
import { Container } from "@/components/layout/container"
import { MobileNavigation } from "@/components/layout/mobile-navigation"
import {
  localizedNavigation,
  localizedSiteConfig,
  shellCopy,
} from "@/content/locales"
import type { Locale } from "@/lib/i18n"

export function SiteHeader({ locale }: { locale: Locale }) {
  const navigation = localizedNavigation[locale]
  const site = localizedSiteConfig[locale]
  const copy = shellCopy[locale]
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        {copy.skip}
      </a>
      <Container className="site-header__bar">
        <div className="site-header__brand">
          <BrunovaLogo location="header" />
        </div>
        <nav aria-label={copy.primaryNavigation} className="desktop-navigation">
          <ul className="desktop-navigation__links">
            {navigation.primary.map((item) => (
              <li key={item.href}>
                <ActiveNavigationLink item={item} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__utilities">
          <AnalyticsLink
            eventName={navigation.portal.analyticsEvent}
            href={navigation.portal.href}
            variant="utility"
          >
            {navigation.portal.label}
          </AnalyticsLink>
          <AnalyticsLink
            eventName={site.primaryAction.analyticsEvent}
            href={site.primaryAction.href}
            variant="primary"
          >
            {site.primaryAction.label}
          </AnalyticsLink>
        </div>

        <MobileNavigation
          copy={copy}
          locale={locale}
          portalItem={navigation.portal}
          primaryAction={site.primaryAction}
          primaryItems={navigation.primary}
        />
      </Container>
    </header>
  )
}
