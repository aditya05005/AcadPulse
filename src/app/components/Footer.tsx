import { BarChart3 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <BarChart3 className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Academic Health Scorecard
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              AI-powered academic performance prediction to help students stay ahead and achieve their goals.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            © 2026 Academic Health Scorecard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
