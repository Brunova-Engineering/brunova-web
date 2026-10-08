import Image from "next/image"
import Link from "next/link"

export function BrunovaLogo({ location }: { location: "header" | "footer" }) {
  const sizes =
    location === "header" ? "(min-width: 1152px) 172px, 132px" : "172px"

  return (
    <Link
      aria-label="Brunova home"
      className={`brunova-logo brunova-logo--${location}`}
      href="/"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="brunova-logo__asset brunova-logo__asset--dark"
        height={181}
        priority={location === "header"}
        sizes={sizes}
        src="/brand/brunova-wordmark-dark.svg"
        unoptimized
        width={899}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="brunova-logo__asset brunova-logo__asset--light"
        height={181}
        priority={location === "header"}
        sizes={sizes}
        src="/brand/brunova-wordmark-light.svg"
        unoptimized
        width={899}
      />
    </Link>
  )
}
