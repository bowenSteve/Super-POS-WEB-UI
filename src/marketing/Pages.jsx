import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PLANS, formatPrice } from './pricing'

const NAV = [
  { key: 'product', label: 'Product', to: '/product' },
  { key: 'multistore', label: 'Multi-store', to: '/multi-store' },
  { key: 'pricing', label: 'Pricing', to: '/pricing' },
  { key: 'customers', label: 'Customers', to: '/customer-stories' },
]

export default function Pages({ section = 'product' }) {
  const [billing, setBilling] = useState('monthly')
  const [slug, setSlug] = useState('')

  const rootDomain = process.env.REACT_APP_ROOT_DOMAIN || 'localhost'
  const annual = billing === 'annual'
  const priceGrowth = formatPrice(PLANS.growth.monthly, annual)
  const priceScale = formatPrice(PLANS.scale.monthly, annual)
  const billingNote = annual ? '· billed yearly' : '· billed monthly'
  const cleanedSlug = (slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-/, '')
  const slugPreview = `${cleanedSlug || 'yourshop'}.${rootDomain}`

  return (
    <div className="font-sans text-brand-ink bg-brand-surface min-h-screen">

      <header className="sticky top-0 z-50 bg-brand-surface/[0.85] backdrop-blur-md border-b border-brand-ink/10">
        <div className="max-w-[1240px] mx-auto px-8 py-4 flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-[26px] h-[26px] rounded-lg bg-brand-ink grid place-items-center"><span className="w-[9px] h-[9px] rounded-full bg-brand-accent" /></span>
            <span className="text-xl font-semibold tracking-[-0.02em]">Singla-POS</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 mr-auto text-[14.5px] font-medium">
            {NAV.map((n) => (
              <Link
                key={n.key}
                to={n.to}
                className={`py-1.5 border-b-2 transition-colors ${
                  section === n.key ? 'border-brand-accent text-brand-ink' : 'border-transparent text-brand-ink/70 hover:text-brand-ink'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 ml-auto md:ml-0">
            <Link to="/login" className="text-[14.5px] font-semibold px-4 py-[10px] rounded-[10px] hover:bg-brand-ink/[0.06] transition-colors">Log in</Link>
            <Link to="/signup" className="text-[14.5px] font-semibold px-5 py-[11px] rounded-[10px] bg-brand-ink text-brand-surface border border-brand-ink hover:bg-brand-accent hover:border-brand-accent hover:text-brand-ink transition-colors">Create account</Link>
          </div>
        </div>
      </header>

      {section === 'product' && (
        <div>
          <section className="max-w-[1240px] mx-auto px-8 pt-20 pb-14 grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-14 items-end">
            <div>
              <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-accent">Product</div>
              <h1 className="text-[clamp(38px,4.6vw,62px)] font-semibold tracking-[-0.02em] leading-[1.05] mt-4">A shop system that fits on one screen.</h1>
            </div>
            <p className="text-[17px] leading-relaxed text-brand-ink/65 m-0">Selling, stock, staff, customers and reporting (in the browser, on whatever device is already on the counter).</p>
          </section>

          <section className="max-w-[1240px] mx-auto px-8 pb-10 grid gap-5">
            <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-6 sm:p-11 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-ink/50">Selling</div>
                <h2 className="text-[30px] font-semibold tracking-[-0.02em] mt-3 mb-3.5">Four taps from scan to receipt</h2>
                <p className="text-[15.5px] leading-relaxed text-brand-ink/65 mb-5">Barcode or search, quantity, payment, done. Split a sale between cash and M-Pesa, hold a ticket while a customer fetches one more thing, refund with a reason attached.</p>
                <ul className="list-none p-0 m-0 grid gap-2.5 text-[14.5px] text-brand-ink/80">
                  <li>Split &amp; part payments</li><li>Held tickets and quotes</li><li>Printed, SMS or WhatsApp receipts</li><li>Discounts with an approval trail</li>
                </ul>
              </div>
              <div className="bg-brand-surface rounded-2xl p-[22px] grid gap-2.5">
                <div className="flex justify-between text-[13.5px] px-3.5 py-3 bg-white rounded-[10px]"><span>Sukari 2kg × 2</span><span className="font-mono">KSh 460</span></div>
                <div className="flex justify-between text-[13.5px] px-3.5 py-3 bg-white rounded-[10px]"><span>Maziwa 500ml × 4</span><span className="font-mono">KSh 260</span></div>
                <div className="flex justify-between text-[13.5px] px-3.5 py-3 bg-white rounded-[10px]"><span>Mkate</span><span className="font-mono">KSh 65</span></div>
                <div className="flex items-center justify-between px-3.5 py-4 bg-brand-ink text-brand-surface rounded-[10px] mt-1.5">
                  <span className="text-[13px] opacity-70">Total due</span><span className="font-mono text-[19px] text-brand-accent">KSh 785</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-[34px]">
                <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-ink/50">Inventory</div>
                <h2 className="text-2xl font-semibold tracking-[-0.025em] mt-3 mb-3">Stock that warns you first</h2>
                <p className="text-[15px] leading-relaxed text-brand-ink/65 mb-[18px]">Reorder points per shop, supplier lead times, batch and expiry tracking for pharmacy and fresh goods.</p>
                <div className="grid gap-2 text-[13.5px]">
                  <div className="flex justify-between px-3 py-[11px] bg-brand-surface rounded-[9px]"><span>Unga 2kg</span><span className="text-[#c8553d] font-semibold">4 left</span></div>
                  <div className="flex justify-between px-3 py-[11px] bg-brand-surface rounded-[9px]"><span>Cooking oil 1L</span><span className="text-brand-ink/55">31 left</span></div>
                </div>
              </div>
              <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-[34px]">
                <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-ink/50">Staff</div>
                <h2 className="text-2xl font-semibold tracking-[-0.025em] mt-3 mb-3">Shifts with a name on them</h2>
                <p className="text-[15px] leading-relaxed text-brand-ink/65 mb-[18px]">Open and close a shift with a cash count. Every void, discount and refund is signed, so variances have an owner.</p>
                <div className="grid gap-2 text-[13.5px]">
                  <div className="flex justify-between px-3 py-[11px] bg-brand-surface rounded-[9px]"><span>John · on duty</span><span className="font-mono">08:02</span></div>
                  <div className="flex justify-between px-3 py-[11px] bg-brand-surface rounded-[9px]"><span>Amina · closed</span><span className="font-mono">−KSh 50</span></div>
                </div>
              </div>
              <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-[34px]">
                <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-ink/50">Reports</div>
                <h2 className="text-2xl font-semibold tracking-[-0.025em] mt-3 mb-3">Numbers an owner can read</h2>
                <p className="text-[15px] leading-relaxed text-brand-ink/65 mb-[18px]">Daily takings, margin by product, slow movers, staff performance (on screen, in Excel, or by WhatsApp at closing).</p>
                <div className="flex items-end gap-[5px] h-[62px]">
                  {[38, 64, 47, 88, 59, 72].map((h, i) => (
                    <div key={i} className={`flex-1 rounded-sm ${h === 88 ? 'bg-brand-accent' : h === 72 ? 'bg-brand-ink' : 'bg-brand-ink/[0.16]'}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-brand-ink text-brand-surface rounded-[20px] p-6 sm:p-11 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] mb-2.5">Web-based, end to end</h2>
                <p className="text-[15px] leading-relaxed text-brand-surface/70 m-0">No installer, no version numbers. Open a browser on the shop laptop, a tablet or a phone and you're on the counter.</p>
              </div>
              <div><div className="text-[14.5px] font-semibold mb-1.5">Any modern browser</div><div className="text-sm text-brand-surface/65">Chrome, Edge, Safari, Firefox (desktop or mobile).</div></div>
              <div><div className="text-[14.5px] font-semibold mb-1.5">Weekly updates</div><div className="text-sm text-brand-surface/65">Shipped for everyone at once. Nothing for you to do.</div></div>
              <div><div className="text-[14.5px] font-semibold mb-1.5">Printers &amp; scanners</div><div className="text-sm text-brand-surface/65">Thermal printers and USB/Bluetooth scanners supported.</div></div>
            </div>
          </section>
        </div>
      )}

      {section === 'multistore' && (
        <div>
          <section className="max-w-[1240px] mx-auto px-8 pt-20 pb-14 grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-14 items-end">
            <div>
              <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-accent">Multi-store</div>
              <h1 className="text-[clamp(38px,4.6vw,62px)] font-semibold tracking-[-0.02em] leading-[1.05] mt-4">One account. A private workspace per business.</h1>
            </div>
            <p className="text-[17px] leading-relaxed text-brand-ink/65 m-0">Every shop you register gets its own address, its own data and its own staff list (switched from a single login).</p>
          </section>

          <section className="max-w-[1240px] mx-auto px-8 pb-10 grid gap-5">
            <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-6 sm:p-11">
              <h2 className="text-[26px] font-semibold tracking-[-0.03em] mb-6">How a workspace is created</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { n: '01', t: 'You pick a name', b: 'We check it, reserve it and mint the subdomain instantly.', accent: false },
                  { n: '02', t: 'Isolated data', b: 'Products, prices, staff, tax and receipts live only in that tenant.', accent: false },
                  { n: '03', t: 'Branches inside it', b: 'Add locations under one business and move stock between them.', accent: false },
                  { n: '04', t: 'Group view', b: 'Owners see every shop side by side, or drill into one.', accent: true },
                ].map((s) => (
                  <div key={s.n} className={`pt-4 border-t-2 ${s.accent ? 'border-brand-accent' : 'border-brand-ink'}`}>
                    <div className="font-mono text-xs text-brand-ink/50">{s.n}</div>
                    <div className="text-base font-semibold mt-2 mb-1.5">{s.t}</div>
                    <p className="text-[14.5px] leading-relaxed text-brand-ink/65 m-0">{s.b}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-brand-ink text-brand-surface rounded-[20px] p-10">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] mb-[18px]">Try an address</h2>
                <div className="flex items-center bg-brand-surface/[0.08] border border-brand-surface/20 rounded-xl pr-3.5">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="mama-njeri"
                    aria-label="Workspace name"
                    className="flex-1 min-w-0 border-0 outline-none bg-transparent text-brand-surface font-mono text-[15px] p-3.5"
                  />
                  <span className="font-mono text-sm text-brand-surface/50">.{rootDomain}</span>
                </div>
                <div className="mt-4 font-mono text-sm text-brand-accent">→ {slugPreview}</div>
                <Link to="/signup" className="inline-block mt-[26px] bg-brand-accent text-brand-ink font-bold text-[15px] px-6 py-3.5 rounded-xl hover:bg-brand-surface transition-colors">Claim it</Link>
              </div>
              <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-10">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] mb-[18px]">Roles that scale</h2>
                <div className="grid gap-2.5 text-[14.5px]">
                  <div className="flex justify-between px-4 py-3.5 bg-brand-surface rounded-[10px]"><span className="font-semibold">Owner</span><span className="text-brand-ink/60">All shops, billing, exports</span></div>
                  <div className="flex justify-between px-4 py-3.5 bg-brand-surface rounded-[10px]"><span className="font-semibold">Manager</span><span className="text-brand-ink/60">One shop, stock &amp; staff</span></div>
                  <div className="flex justify-between px-4 py-3.5 bg-brand-surface rounded-[10px]"><span className="font-semibold">Attendant</span><span className="text-brand-ink/60">Sell, hold, request refund</span></div>
                  <div className="flex justify-between px-4 py-3.5 bg-brand-surface rounded-[10px]"><span className="font-semibold">Accountant</span><span className="text-brand-ink/60">Read-only reports</span></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {section === 'pricing' && (
        <div>
          <section className="max-w-[1240px] mx-auto px-8 pt-20 pb-10 flex items-end justify-between gap-8 flex-wrap">
            <div>
              <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-accent">Pricing</div>
              <h1 className="text-[clamp(38px,4.6vw,62px)] font-semibold tracking-[-0.02em] leading-[1.05] mt-4 max-w-[620px]">Priced per shop, not per headache.</h1>
            </div>
            <div className="flex gap-1 p-1 border border-brand-ink/[0.16] rounded-full bg-white">
              <button onClick={() => setBilling('monthly')} className={`border-0 text-sm font-semibold px-[18px] py-2.5 rounded-full cursor-pointer transition-colors ${!annual ? 'bg-brand-ink text-brand-surface' : 'bg-transparent text-brand-ink/60'}`}>Monthly</button>
              <button onClick={() => setBilling('annual')} className={`border-0 text-sm font-semibold px-[18px] py-2.5 rounded-full cursor-pointer transition-colors ${annual ? 'bg-brand-ink text-brand-surface' : 'bg-transparent text-brand-ink/60'}`}>Annual −20%</button>
            </div>
          </section>

          <section className="max-w-[1240px] mx-auto px-8 pb-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-brand-ink/[0.14] rounded-2xl p-8 flex flex-col">
              <div className="text-[15px] font-bold">{PLANS.starter.name}</div>
              <p className="text-sm text-brand-ink/60 mt-1.5">One shop, getting started.</p>
              <div className="text-[44px] font-semibold tracking-[-0.035em] leading-none mt-[26px] mb-1">KSh 0</div>
              <div className="text-[13px] text-brand-ink/55">free forever · no card required</div>
              <ul className="list-none p-0 my-[26px] grid gap-[11px] text-[14.5px] text-brand-ink/80">
                <li>1 shop · 2 staff accounts</li><li>Cash &amp; M-Pesa payments</li><li>Up to 300 products</li><li>Daily takings report</li>
              </ul>
              <Link to="/signup" className="mt-auto text-center border border-brand-ink font-semibold text-[15px] py-[13px] rounded-xl hover:bg-brand-ink hover:text-brand-surface transition-colors">Start free</Link>
            </div>
            <div className="bg-brand-ink text-brand-surface rounded-2xl p-8 flex flex-col relative">
              <div className="absolute top-5 right-5 bg-brand-accent text-brand-ink text-[11.5px] font-bold tracking-[0.05em] uppercase px-[10px] py-[5px] rounded-full">Most shops</div>
              <div className="text-[15px] font-bold">{PLANS.growth.name}</div>
              <p className="text-sm text-brand-surface/70 mt-1.5">A busy shop with staff and stock.</p>
              <div className="text-[44px] font-semibold tracking-[-0.035em] leading-none mt-[26px] mb-1 text-brand-accent">KSh {priceGrowth}</div>
              <div className="text-[13px] text-brand-surface/60">per shop / month {billingNote}</div>
              <ul className="list-none p-0 my-[26px] grid gap-[11px] text-[14.5px] text-brand-surface/85">
                <li>Up to 3 shops · unlimited staff</li><li>Shift control &amp; audit trail</li><li>Customer accounts and credit</li><li>Margin, staff and supplier reports</li><li>Any browser (laptop, tablet or phone)</li>
              </ul>
              <Link to="/signup" className="mt-auto text-center bg-brand-accent text-brand-ink font-bold text-[15px] py-3.5 rounded-xl hover:bg-brand-surface transition-colors">Start 30-day trial</Link>
            </div>
            <div className="bg-white border border-brand-ink/[0.14] rounded-2xl p-8 flex flex-col">
              <div className="text-[15px] font-bold">{PLANS.scale.name}</div>
              <p className="text-sm text-brand-ink/60 mt-1.5">Several branches under one roof.</p>
              <div className="text-[44px] font-semibold tracking-[-0.035em] leading-none mt-[26px] mb-1">KSh {priceScale}</div>
              <div className="text-[13px] text-brand-ink/55">per shop / month {billingNote}</div>
              <ul className="list-none p-0 my-[26px] grid gap-[11px] text-[14.5px] text-brand-ink/80">
                <li>Unlimited shops and branches</li><li>Stock transfers between shops</li><li>Consolidated group reporting</li><li>Roles, permissions, SSO</li><li>Named account manager</li>
              </ul>
              <Link to="/#demo" className="mt-auto text-center border border-brand-ink font-semibold text-[15px] py-[13px] rounded-xl hover:bg-brand-ink hover:text-brand-surface transition-colors">Book a demo</Link>
            </div>
          </section>

          <section className="max-w-[1240px] mx-auto px-8 pb-10">
            <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-6 sm:p-10">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] mb-5">Common questions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                <div><div className="text-[15.5px] font-semibold mb-2">Do you charge per staff member?</div><p className="text-[14.5px] leading-relaxed text-brand-ink/65 m-0">No. Invite as many attendants as you need (you pay per shop).</p></div>
                <div><div className="text-[15.5px] font-semibold mb-2">Is there a transaction fee?</div><p className="text-[14.5px] leading-relaxed text-brand-ink/65 m-0">None from us. Your M-Pesa charges stay between you and Safaricom.</p></div>
                <div><div className="text-[15.5px] font-semibold mb-2">What happens after the trial?</div><p className="text-[14.5px] leading-relaxed text-brand-ink/65 m-0">You drop to the free plan (data intact) until you choose to upgrade.</p></div>
                <div><div className="text-[15.5px] font-semibold mb-2">Can I export my data?</div><p className="text-[14.5px] leading-relaxed text-brand-ink/65 m-0">Any time, in Excel or CSV, including full transaction history.</p></div>
              </div>
            </div>
          </section>
        </div>
      )}

      {section === 'customers' && (
        <div>
          <section className="max-w-[1240px] mx-auto px-8 pt-20 pb-14 grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-14 items-end">
            <div>
              <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-accent">Customers</div>
              <h1 className="text-[clamp(38px,4.6vw,62px)] font-semibold tracking-[-0.02em] leading-[1.05] mt-4">Shops that stopped counting twice.</h1>
            </div>
            <p className="text-[17px] leading-relaxed text-brand-ink/65 m-0">From a single kiosk in Nakuru to a four-branch hardware group in Mombasa.</p>
          </section>

          <section className="max-w-[1240px] mx-auto px-8 pb-10 grid gap-5">
            <div className="bg-brand-ink text-brand-surface rounded-[20px] p-8 sm:p-14">
              <p className="text-[clamp(24px,2.6vw,34px)] font-medium tracking-[-0.025em] leading-[1.3] m-0 max-w-[820px] text-balance">"We closed four branches' books in eleven minutes. Before Singla-POS that was a Sunday."</p>
              <div className="mt-[26px] text-[14.5px] text-brand-surface/70">Wanjiru Kamau · Director, Nyumbani Mart · Nakuru</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-[34px]">
                <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-ink/50">Bidii Pharmacy</div>
                <div className="text-[38px] font-semibold tracking-[-0.035em] mt-4 mb-1.5 text-brand-accent">−92%</div>
                <p className="text-[15px] leading-relaxed text-brand-ink/65 mb-4">expired stock written off, after switching to batch and expiry alerts.</p>
                <div className="text-[13.5px] text-brand-ink/55">1 shop · Kisumu</div>
              </div>
              <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-[34px]">
                <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-ink/50">Tembo Hardware</div>
                <div className="text-[38px] font-semibold tracking-[-0.035em] mt-4 mb-1.5 text-brand-accent">4 → 1</div>
                <p className="text-[15px] leading-relaxed text-brand-ink/65 mb-4">separate stock books merged into one group view with inter-branch transfers.</p>
                <div className="text-[13.5px] text-brand-ink/55">4 branches · Mombasa</div>
              </div>
              <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-[34px]">
                <div className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-brand-ink/50">Chai &amp; Co</div>
                <div className="text-[38px] font-semibold tracking-[-0.035em] mt-4 mb-1.5 text-brand-accent">11 min</div>
                <p className="text-[15px] leading-relaxed text-brand-ink/65 mb-4">to close the day, including the cash count and the owner's WhatsApp summary.</p>
                <div className="text-[13.5px] text-brand-ink/55">2 shops · Nairobi</div>
              </div>
            </div>

            <div className="bg-white border border-brand-ink/[0.12] rounded-[20px] p-6 sm:p-11 flex items-center justify-between gap-8 flex-wrap">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] mb-2">Want the same on your counter?</h2>
                <p className="text-[15.5px] text-brand-ink/65 m-0">Thirty minutes, screen-shared, with your own price list loaded.</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link to="/#demo" className="bg-brand-accent text-brand-ink font-bold text-[15px] px-6 py-3.5 rounded-xl hover:bg-brand-ink hover:text-brand-surface transition-colors">Book a demo</Link>
                <Link to="/signup" className="border border-brand-ink font-semibold text-[15px] px-6 py-3.5 rounded-xl hover:bg-brand-ink hover:text-brand-surface transition-colors">Create account</Link>
              </div>
            </div>
          </section>
        </div>
      )}

      <footer className="border-t border-brand-ink/[0.12] mt-10">
        <div className="max-w-[1240px] mx-auto px-8 pt-7 pb-12 flex justify-between gap-5 flex-wrap text-[13px] text-brand-ink/50">
          <span>© 2026 Singla-POS Systems Ltd · Nairobi</span>
          <span className="flex gap-[22px]">
            <Link to="/" className="hover:text-brand-ink transition-colors">Home</Link>
            <Link to="/login" className="hover:text-brand-ink transition-colors">Log in</Link>
            <Link to="/signup" className="hover:text-brand-ink transition-colors">Create account</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
