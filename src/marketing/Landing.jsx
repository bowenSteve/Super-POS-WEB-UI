import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PLANS, formatPrice } from './pricing'

const slugify = (v) =>
  (v || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-/, '')

export default function Landing() {
  const [slug, setSlug] = useState('')
  const [billing, setBilling] = useState('monthly')
  const [sent, setSent] = useState(false)

  const rootDomain = process.env.REACT_APP_ROOT_DOMAIN || 'localhost'
  const annual = billing === 'annual'
  const name = slugify(slug) || 'yourshop'
  const slugPreview = `${name}.${rootDomain}`

  const priceGrowth = formatPrice(PLANS.growth.monthly, annual)
  const priceScale = formatPrice(PLANS.scale.monthly, annual)
  const priceStarter = formatPrice(PLANS.starter.monthly, annual)
  const billingNote = annual ? '· billed yearly' : '· billed monthly'

  const navLink = 'text-[14.5px] font-medium opacity-70 hover:opacity-100 hover:text-brand-ink transition-colors'

  return (
    <div className="font-sans text-brand-ink bg-brand-surface min-h-screen overflow-x-hidden">

      <header className="sticky top-0 z-50 bg-brand-surface/[0.82] backdrop-blur-md border-b border-brand-ink/10">
        <div className="max-w-[1240px] mx-auto px-8 py-4 flex items-center gap-10">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="w-[26px] h-[26px] rounded-lg bg-brand-ink grid place-items-center">
              <span className="w-[9px] h-[9px] rounded-full bg-brand-accent" />
            </span>
            <span className="font-semibold tracking-[-0.01em] text-[25px]">Singla-POS</span>
          </a>
          <nav className="hidden md:flex items-center gap-[30px] mr-auto">
            <Link to="/product" className={navLink}>Product</Link>
            <Link to="/multi-store" className={navLink}>Multi-store</Link>
            <Link to="/pricing" className={navLink}>Pricing</Link>
            <Link to="/customer-stories" className={navLink}>Customers</Link>
          </nav>
          <div className="flex items-center gap-3 ml-auto md:ml-0">
            <Link to="/login" className="text-[14.5px] font-semibold px-4 py-[10px] rounded-[10px] hover:bg-brand-ink/[0.06] transition-colors">Log in</Link>
            <a href="#demo" className="text-[14.5px] font-semibold px-5 py-[11px] rounded-[10px] bg-brand-ink text-brand-surface border border-brand-ink hover:bg-brand-accent hover:border-brand-accent hover:text-brand-ink transition-colors">Book a demo</a>
          </div>
        </div>
      </header>

      <section id="top" className="max-w-[1240px] mx-auto px-8 pt-[84px] pb-[72px] grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-[9px] pl-[9px] pr-[14px] py-[7px] border border-brand-ink/[0.16] rounded-full text-[12.5px] font-semibold tracking-[0.04em] uppercase">
            <span className="w-[7px] h-[7px] rounded-full bg-brand-accent" />
            Multi-store point of sale
          </div>
          <h1 className="font-semibold tracking-[-0.025em] text-[clamp(46px,5.6vw,78px)] leading-[1.02] mt-[26px] text-balance">
            Run every shop,<br />every branch, from<br />
            <em className="italic text-brand-accent">one clean screen.</em>
          </h1>
          <p className="text-lg leading-relaxed max-w-[480px] mt-6 text-brand-ink/70">
            Singla-POS gives each shop its own workspace, staff, stock and takings (cash or M-Pesa) with live numbers the owner can read in three seconds.
          </p>

          <div className="mt-[34px] max-w-[520px]">
            <label htmlFor="slug" className="block text-[12.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/55 mb-2.5">Claim your workspace</label>
            <div className="flex gap-2.5 flex-wrap">
              <div className="flex-1 min-w-[260px] flex items-center bg-white border border-brand-ink/[0.16] rounded-xl pl-3.5 pr-1 focus-within:border-brand-ink transition-colors">
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="mama-njeri"
                  autoComplete="off"
                  className="flex-1 min-w-0 border-0 outline-none bg-transparent font-mono text-[15px] py-3"
                />
                <span className="font-mono text-[15px] text-brand-ink/40 pr-3">.{rootDomain}</span>
              </div>
              <Link to="/signup" className="inline-flex items-center justify-center bg-brand-accent text-brand-ink font-bold text-[15px] px-[26px] py-[15px] rounded-xl border border-brand-accent hover:bg-brand-ink hover:border-brand-ink hover:text-brand-surface transition-colors">Create account</Link>
            </div>
            <p className="text-[13.5px] text-brand-ink/60 mt-3">
              Your team signs in at <span className="font-mono text-brand-ink">{slugPreview}</span> (free for 30 days, no card).
            </p>
          </div>

          {/*
          <div className="flex flex-wrap gap-7 mt-10 pt-7 border-t border-brand-ink/[0.12]">
            <div>
              <div className="font-semibold tracking-[-0.03em] text-[30px] leading-none">2,400+</div>
              <div className="text-[13px] text-brand-ink/60 mt-1">shops live</div>
            </div>
            <div>
              <div className="font-semibold tracking-[-0.03em] text-[30px] leading-none">KSh 8.1B</div>
              <div className="text-[13px] text-brand-ink/60 mt-1">processed in 2025</div>
            </div>
            <div>
              <div className="font-semibold tracking-[-0.03em] text-[30px] leading-none">99.98%</div>
              <div className="text-[13px] text-brand-ink/60 mt-1">uptime, in the browser</div>
            </div>
          </div>
          */}
        </div>

        <div className="relative">
          <div className="absolute -inset-x-[8%] -top-[6%] -bottom-[14%] bg-brand-ink rounded-[26px] opacity-[0.06]" />
          <div className="relative bg-white border border-brand-ink/[0.12] rounded-2xl shadow-[0_30px_70px_-40px_rgba(20,55,59,0.55)] overflow-hidden">
            <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-brand-ink/10">
              <div className="flex items-center gap-2 font-mono text-xs text-brand-ink/55">
                <span className="w-2 h-2 rounded-full bg-brand-accent" />
                {slugPreview}
              </div>
              <div className="text-xs font-semibold text-brand-ink/50">Today</div>
            </div>
            <div className="p-5 grid gap-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-brand-surface rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-brand-ink/50">Sales</div>
                  <div className="font-semibold tracking-[-0.03em] text-2xl mt-1.5">KSh 184,320</div>
                </div>
                <div className="bg-brand-surface rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-brand-ink/50">Tickets</div>
                  <div className="font-semibold tracking-[-0.03em] text-2xl mt-1.5">312</div>
                </div>
                <div className="bg-brand-ink rounded-xl p-3.5 text-brand-surface">
                  <div className="text-[11px] font-semibold tracking-[0.05em] uppercase opacity-60">Low stock</div>
                  <div className="font-semibold tracking-[-0.03em] text-2xl mt-1.5 text-brand-accent">4</div>
                </div>
              </div>
              <div className="border border-brand-ink/10 rounded-xl p-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-[13px] font-semibold">Hourly takings</div>
                  <div className="font-mono text-[11px] text-brand-ink/45">08:00 – 20:00</div>
                </div>
                <div className="flex items-end gap-1.5 h-24 mt-3.5">
                  {[26, 41, 34, 62, 88, 71, 54, 79, 46, 33].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded ${h === 88 ? 'bg-brand-accent' : h === 79 ? 'bg-brand-ink' : 'bg-brand-ink/[0.16]'}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between px-3.5 py-3 bg-brand-surface rounded-[10px]">
                  <div className="flex items-center gap-2.5 text-[13.5px] font-semibold">
                    <span className="w-[22px] h-[22px] rounded-[7px] bg-brand-ink" /> M-Pesa
                  </div>
                  <div className="font-mono text-[13px]">KSh 121,900</div>
                </div>
                <div className="flex items-center justify-between px-3.5 py-3 bg-brand-surface rounded-[10px]">
                  <div className="flex items-center gap-2.5 text-[13.5px] font-semibold">
                    <span className="w-[22px] h-[22px] rounded-[7px] bg-brand-accent" /> Cash
                  </div>
                  <div className="font-mono text-[13px]">KSh 62,420</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
      <section className="border-y border-brand-ink/10">
        <div className="max-w-[1240px] mx-auto px-8 py-[22px] flex items-center gap-10 flex-wrap justify-between">
          <span className="text-[12.5px] tracking-[0.08em] uppercase text-brand-ink/45">Trusted by growing chains</span>
          <div className="flex gap-[42px] flex-wrap font-semibold tracking-[-0.03em] text-xl text-brand-ink/40">
            <span>Nyumbani Mart</span><span>Kaa Fresh</span><span>Bidii Pharmacy</span><span>Tembo Hardware</span><span>Chai &amp; Co</span>
          </div>
        </div>
      </section>
      */}

      <section id="product" className="max-w-[1240px] mx-auto px-8 pt-24 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-14 items-end">
          <h2 className="font-semibold tracking-[-0.02em] text-[clamp(34px,4vw,52px)] leading-[1.08] m-0">
            Everything the shop needs. Nothing it doesn't.
          </h2>
          <p className="text-[17px] leading-relaxed text-brand-ink/65 m-0 max-w-[520px]">
            We rebuilt the shop counter around the way Kenyan shops actually trade (split payments, shift handovers, stock that moves faster than the paperwork).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-ink/[0.12] border border-brand-ink/[0.12] rounded-2xl overflow-hidden mt-[52px]">
          {[
            { title: 'Sell in four taps', body: 'Scan, split the payment between cash and M-Pesa, then print or send the receipt. Fast even on a thin connection.' },
            { title: 'Stock that warns you', body: 'Reorder points per branch, supplier lead times, and an alert before the shelf is empty (not after).' },
            { title: 'Shifts & accountability', body: 'Open and close a shift with a cash count. Every void, discount and refund carries a name.' },
            { title: 'Customers & credit', body: 'Track the regulars, their balances and what they buy (so a debt book never lives in a notebook).' },
            { title: 'Reports owners read', body: 'Daily takings, margin by product, staff performance. Exported to Excel or delivered by WhatsApp at close.' },
          ].map((f) => (
            <div key={f.title} className="bg-brand-surface px-[30px] pt-[34px] pb-[38px] hover:bg-white transition-colors">
              <span className="block w-[30px] h-[30px] rounded-[9px] border-[1.5px] border-brand-ink" />
              <h3 className="text-lg font-bold mt-[22px] mb-2 tracking-[-0.01em]">{f.title}</h3>
              <p className="text-[15px] leading-relaxed text-brand-ink/65 m-0">{f.body}</p>
            </div>
          ))}
          <div className="bg-brand-ink text-brand-surface px-[30px] pt-[34px] pb-[38px]">
            <span className="block w-[30px] h-[30px] rounded-[9px] border-[1.5px] border-brand-accent" />
            <h3 className="text-lg font-bold mt-[22px] mb-2 tracking-[-0.01em]">Runs in the browser</h3>
            <p className="text-[15px] leading-relaxed text-brand-surface/70 m-0">Nothing to install. Open Singla-POS on the shop laptop, a tablet or a phone (updates ship weekly, on their own).</p>
          </div>
        </div>
      </section>

      <section id="tenancy" className="max-w-[1240px] mx-auto px-8 py-24">
        <div className="bg-brand-ink text-brand-surface rounded-3xl p-8 sm:p-14 grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div>
            <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-accent">Multi-tenant by design</div>
            <h2 className="font-semibold tracking-[-0.02em] text-[clamp(32px,3.6vw,48px)] leading-[1.1] mt-[18px]">
              One account. A private address for every business you run.
            </h2>
            <p className="text-[16.5px] leading-relaxed text-brand-surface/75 mt-5 max-w-[460px]">
              Sign up once and we mint a workspace on your own subdomain. Data, staff, pricing and tax settings never cross between tenants (switch shops from the same login).
            </p>
            <div className="flex gap-3 mt-8 flex-wrap">
              <Link to="/signup" className="bg-brand-accent text-brand-ink font-bold text-[15px] px-6 py-3.5 rounded-xl hover:bg-brand-surface transition-colors">Create your workspace</Link>
              <a href="#demo" className="border border-brand-surface/30 text-brand-surface font-semibold text-[15px] px-6 py-3.5 rounded-xl hover:border-brand-accent hover:text-brand-accent transition-colors">Talk to sales</a>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-4 bg-brand-surface/[0.07] border border-brand-surface/[0.14] rounded-2xl px-5 py-[18px]">
              <span className="font-mono text-[14.5px]">nyumbani.{rootDomain}</span>
              <span className="text-xs text-brand-surface/60">3 branches</span>
            </div>
            <div className="flex items-center justify-between gap-4 bg-brand-surface/[0.07] border border-brand-surface/[0.14] rounded-2xl px-5 py-[18px]">
              <span className="font-mono text-[14.5px]">bidii-pharmacy.{rootDomain}</span>
              <span className="text-xs text-brand-surface/60">1 branch</span>
            </div>
            <div className="flex items-center justify-between gap-4 bg-brand-accent text-brand-ink rounded-2xl px-5 py-[18px]">
              <span className="font-mono text-[14.5px] font-medium">{slugPreview}</span>
              <span className="text-xs font-bold">yours, in 40s</span>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="max-w-[1240px] mx-auto px-8 pt-6 pb-24">
        <div className="flex items-end justify-between gap-8 flex-wrap">
          <h2 className="font-semibold tracking-[-0.02em] text-[clamp(34px,4vw,52px)] leading-[1.08] m-0">Priced per shop, not per headache.</h2>
          <div className="flex gap-1 p-1 border border-brand-ink/[0.16] rounded-full bg-white">
            <button onClick={() => setBilling('monthly')} className={`border-0 text-sm font-semibold px-[18px] py-2.5 rounded-full cursor-pointer transition-colors ${!annual ? 'bg-brand-ink text-brand-surface' : 'bg-transparent text-brand-ink/60'}`}>Monthly</button>
            <button onClick={() => setBilling('annual')} className={`border-0 text-sm font-semibold px-[18px] py-2.5 rounded-full cursor-pointer transition-colors ${annual ? 'bg-brand-ink text-brand-surface' : 'bg-transparent text-brand-ink/60'}`}>Annual −20%</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-11">
          <div className="bg-white border border-brand-ink/[0.14] rounded-2xl p-8 flex flex-col">
            <div className="text-[15px] font-bold">{PLANS.starter.name}</div>
            <p className="text-sm text-brand-ink/60 mt-1.5">One shop, getting started.</p>
            <div className="font-semibold tracking-[-0.03em] text-5xl leading-none mt-[26px] mb-1">KSh {priceStarter}</div>
            <div className="text-[13px] text-brand-ink/55">free forever · no card required</div>
            <ul className="list-none p-0 my-[26px] grid gap-[11px] text-[14.5px] text-brand-ink/80">
              <li>1 shop · 2 staff accounts</li>
              <li>Cash &amp; M-Pesa payments</li>
              <li>Inventory up to 300 SKUs</li>
              <li>Daily takings report</li>
            </ul>
            <Link to="/signup" className="mt-auto text-center border border-brand-ink font-semibold text-[15px] py-[13px] rounded-xl hover:bg-brand-ink hover:text-brand-surface transition-colors">Start free</Link>
          </div>

          <div className="bg-brand-ink text-brand-surface rounded-2xl p-8 flex flex-col relative shadow-[0_30px_60px_-40px_rgba(20,55,59,0.8)]">
            <div className="absolute top-5 right-5 bg-brand-accent text-brand-ink text-[11.5px] font-bold tracking-[0.05em] uppercase px-[10px] py-[5px] rounded-full">Most shops</div>
            <div className="text-[15px] font-bold">{PLANS.growth.name}</div>
            <p className="text-sm text-brand-surface/70 mt-1.5">A busy shop with staff and stock.</p>
            <div className="font-semibold tracking-[-0.03em] text-5xl leading-none mt-[26px] mb-1 text-brand-accent">KSh {priceGrowth}</div>
            <div className="text-[13px] text-brand-surface/60">per shop / month {billingNote}</div>
            <ul className="list-none p-0 my-[26px] grid gap-[11px] text-[14.5px] text-brand-surface/85">
              <li>Up to 3 shops · unlimited staff</li>
              <li>Shift control &amp; audit trail</li>
              <li>Customer accounts and credit</li>
              <li>Margin, staff and supplier reports</li>
              <li>Any browser (laptop, tablet or phone)</li>
            </ul>
            <Link to="/signup" className="mt-auto text-center bg-brand-accent text-brand-ink font-bold text-[15px] py-3.5 rounded-xl hover:bg-brand-surface transition-colors">Start 30-day trial</Link>
          </div>

          <div className="bg-white border border-brand-ink/[0.14] rounded-2xl p-8 flex flex-col">
            <div className="text-[15px] font-bold">{PLANS.scale.name}</div>
            <p className="text-sm text-brand-ink/60 mt-1.5">Several branches under one roof.</p>
            <div className="font-semibold tracking-[-0.03em] text-5xl leading-none mt-[26px] mb-1">KSh {priceScale}</div>
            <div className="text-[13px] text-brand-ink/55">per shop / month {billingNote}</div>
            <ul className="list-none p-0 my-[26px] grid gap-[11px] text-[14.5px] text-brand-ink/80">
              <li>Unlimited shops and branches</li>
              <li>Stock transfers between shops</li>
              <li>Consolidated group reporting</li>
              <li>Roles, permissions, SSO</li>
              <li>Named account manager</li>
            </ul>
            <a href="#demo" className="mt-auto text-center border border-brand-ink font-semibold text-[15px] py-[13px] rounded-xl hover:bg-brand-ink hover:text-brand-surface transition-colors">Book a demo</a>
          </div>
        </div>
      </section>

      <section className="border-t border-brand-ink/10">
        <div className="max-w-[980px] mx-auto px-8 py-[88px] text-center">
          <p className="font-semibold tracking-[-0.015em] text-[clamp(26px,3.2vw,40px)] leading-[1.28] m-0 text-balance">
            "We closed four branches' books in eleven minutes. Before Singla-POS that was a Sunday."
          </p>
          <div className="mt-[26px] text-sm text-brand-ink/60">Wanjiru Kamau · Director, Nyumbani Mart · Nakuru</div>
        </div>
      </section>

      <section id="demo" className="bg-brand-ink">
        <div className="max-w-[1240px] mx-auto px-8 py-[88px] grid grid-cols-1 md:grid-cols-[1fr_0.9fr] gap-16 items-start text-brand-surface">
          <div>
            <h2 className="font-semibold tracking-[-0.02em] text-[clamp(34px,4vw,54px)] leading-[1.06] m-0">
              See it on your own products.
            </h2>
            <p className="text-[17px] leading-relaxed text-brand-surface/75 mt-5 max-w-[440px]">
              Thirty minutes, screen-shared, with your price list loaded. We set up the workspace live (you keep it either way).
            </p>
            <div className="grid gap-3.5 mt-[34px] text-[15px] text-brand-surface/80">
              <div className="flex gap-3 items-center"><span className="w-1.5 h-1.5 rounded-full bg-brand-accent" /> Migration of your existing stock list</div>
              <div className="flex gap-3 items-center"><span className="w-1.5 h-1.5 rounded-full bg-brand-accent" /> M-Pesa paybill connected on the call</div>
              <div className="flex gap-3 items-center"><span className="w-1.5 h-1.5 rounded-full bg-brand-accent" /> Staff training pack, in Swahili or English</div>
            </div>
          </div>

          <div className="bg-brand-surface text-brand-ink rounded-[20px] p-8">
            {!sent && (
              <div>
                <div className="text-lg font-bold">Book a demo</div>
                <p className="text-sm text-brand-ink/60 mt-1.5 mb-6">We reply within one business day.</p>
                <div className="grid gap-3.5">
                  <div className="grid gap-[7px]">
                    <label htmlFor="d-name" className="text-[12.5px] font-semibold tracking-[0.05em] uppercase text-brand-ink/55">Your name</label>
                    <input id="d-name" type="text" placeholder="Wanjiru Kamau" className="bg-white border border-brand-ink/[0.16] rounded-[11px] px-3.5 py-[13px] text-[15px] outline-none focus:border-brand-ink transition-colors" />
                  </div>
                  <div className="grid gap-[7px]">
                    <label htmlFor="d-biz" className="text-[12.5px] font-semibold tracking-[0.05em] uppercase text-brand-ink/55">Business</label>
                    <input id="d-biz" type="text" placeholder="Nyumbani Mart" className="bg-white border border-brand-ink/[0.16] rounded-[11px] px-3.5 py-[13px] text-[15px] outline-none focus:border-brand-ink transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="grid gap-[7px]">
                      <label htmlFor="d-phone" className="text-[12.5px] font-semibold tracking-[0.05em] uppercase text-brand-ink/55">Phone</label>
                      <input id="d-phone" type="tel" placeholder="+254 7.." className="bg-white border border-brand-ink/[0.16] rounded-[11px] px-3.5 py-[13px] text-[15px] outline-none focus:border-brand-ink transition-colors" />
                    </div>
                    <div className="grid gap-[7px]">
                      <label htmlFor="d-tills" className="text-[12.5px] font-semibold tracking-[0.05em] uppercase text-brand-ink/55">Branches</label>
                      <select id="d-tills" className="bg-white border border-brand-ink/[0.16] rounded-[11px] px-3 py-[13px] text-[15px] outline-none focus:border-brand-ink transition-colors">
                        <option>1</option><option>2–5</option><option>6–20</option><option>20+</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => setSent(true)} className="mt-1.5 bg-brand-accent border border-brand-accent text-brand-ink font-bold text-[15px] py-[15px] rounded-xl cursor-pointer hover:bg-brand-ink hover:border-brand-ink hover:text-brand-surface transition-colors">Request my demo</button>
                  <p className="text-[12.5px] text-brand-ink/50 mt-0.5 text-center">Prefer to explore alone? <Link to="/signup" className="underline">Create a free account</Link>.</p>
                </div>
              </div>
            )}
            {sent && (
              <div className="min-h-[380px] grid place-content-center text-center gap-2.5">
                <div className="font-semibold tracking-[-0.03em] text-[34px]">Asante.</div>
                <p className="text-[15px] text-brand-ink/65 m-0 max-w-[280px]">Our team will call you to confirm a time. Check your phone shortly.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-brand-surface">
        <div className="max-w-[1240px] mx-auto px-8 pt-16 pb-[34px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-[26px] h-[26px] rounded-lg bg-brand-ink grid place-items-center"><span className="w-[9px] h-[9px] rounded-full bg-brand-accent" /></span>
              <span className="font-semibold tracking-[-0.03em] text-[25px]">Singla-POS</span>
            </div>
            <p className="text-[14.5px] leading-relaxed text-brand-ink/60 mt-4 max-w-[280px]">Point of sale for shops that are growing faster than their paperwork. Nairobi, Kenya.</p>
          </div>
          <div className="grid gap-2.5 content-start text-[14.5px] text-brand-ink/70">
            <div className="font-bold text-brand-ink mb-1">Product</div>
            <Link to="/product" className="hover:text-brand-accent transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-brand-accent transition-colors">Pricing</Link>
            <Link to="/multi-store" className="hover:text-brand-accent transition-colors">Multi-store</Link>
            <a href="#demo" className="hover:text-brand-accent transition-colors">Book a demo</a>
          </div>
          <div className="grid gap-2.5 content-start text-[14.5px] text-brand-ink/70">
            <div className="font-bold text-brand-ink mb-1">Company</div>
            <Link to="/customer-stories" className="hover:text-brand-accent transition-colors">Customers</Link>
            <a href="#top" className="hover:text-brand-accent transition-colors">Partners</a>
            <a href="#top" className="hover:text-brand-accent transition-colors">Careers</a>
            <a href="#top" className="hover:text-brand-accent transition-colors">Contact</a>
          </div>
          <div className="grid gap-2.5 content-start text-[14.5px] text-brand-ink/70">
            <div className="font-bold text-brand-ink mb-1">Account</div>
            <Link to="/login" className="hover:text-brand-accent transition-colors">Log in</Link>
            <Link to="/signup" className="hover:text-brand-accent transition-colors">Create account</Link>
            <a href="#top" className="hover:text-brand-accent transition-colors">Status</a>
            <a href="#top" className="hover:text-brand-accent transition-colors">Help centre</a>
          </div>
        </div>
        <div className="max-w-[1240px] mx-auto px-8 pt-5 pb-10 border-t border-brand-ink/[0.12] flex justify-between gap-5 flex-wrap text-[13px] text-brand-ink/50">
          <span>© 2026 Singla-POS Systems Ltd.</span>
          <span className="flex gap-[22px]"><a href="#top" className="hover:text-brand-ink transition-colors">Privacy</a><a href="#top" className="hover:text-brand-ink transition-colors">Terms</a><a href="#top" className="hover:text-brand-ink transition-colors">Security</a></span>
        </div>
      </footer>
    </div>
  )
}
