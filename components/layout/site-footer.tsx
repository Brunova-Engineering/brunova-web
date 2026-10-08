import Link from "next/link"

import { AnalyticsLink } from "@/components/analytics/analytics-link"
import { BrunovaLogo } from "@/components/brand/brunova-logo"
import { Container } from "@/components/layout/container"
import {
  localizedNavigation,
  localizedSiteConfig,
  shellCopy,
} from "@/content/locales"
import type { Locale } from "@/lib/i18n"

export function SiteFooter({ locale }: { locale: Locale }) {
  const navigation = localizedNavigation[locale]
  const site = localizedSiteConfig[locale]
  return (
    <footer className="site-footer">
      <Container className="site-footer__inner">
        <div className="site-footer__identity">
          <BrunovaLogo location="footer" />
          <p>{site.descriptor}</p>
        </div>

        <div className="site-footer__continuation">
          <nav aria-label={shellCopy[locale].footerNavigation}>
            <ul className="site-footer__links">
              {navigation.footer.map((item) => (
                <li key={item.href}>
                  {"analyticsEvent" in item && item.analyticsEvent ? (
                    <AnalyticsLink
                      eventName={item.analyticsEvent}
                      href={item.href}
                      variant="text"
                    >
                      {item.label}
                    </AnalyticsLink>
                  ) : (
                    <Link href={item.href}>{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <p className="site-footer__copyright">
            © {new Date().getFullYear()} Brunova
          </p>
        </div>
      </Container>
    </footer>
  )
}
