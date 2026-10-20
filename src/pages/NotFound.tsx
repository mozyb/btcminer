import { Link } from "react-router-dom";
import PageMeta from "@/components/common/PageMeta";

export default function NotFound() {
  return (
    <>
      <PageMeta title="Page Not Found" description="" />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
        <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
          <h1 className="mb-8 font-bold text-foreground text-4xl md:text-6xl">
            404
          </h1>
          <p className="mt-6 mb-4 text-2xl font-semibold text-foreground">Page Not Found</p>
          <p className="mt-4 mb-8 text-base text-muted-foreground sm:text-lg text-pretty">
            The page may have been deleted or does not exist. Please check the
            URL is correct.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <p className="absolute text-sm text-center text-muted-foreground -translate-x-1/2 bottom-6 left-1/2">
          &copy; {new Date().getFullYear()} BTCMiner.online
        </p>
      </div>
    </>
  );
}
