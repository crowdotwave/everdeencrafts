# Everdeen Crafts

Website for Everdeen Crafts, memorial resin work in Kitchener, Ontario.

Four pages, no build step, no dependencies. Plain HTML, CSS and JavaScript,
served straight from GitHub Pages.

| Page | File | What it does |
| --- | --- | --- |
| Home | `index.html` | Intro, the three kinds of work, a preview of recent pieces |
| The Work | `gallery.html` | Full gallery with category filters and a lightbox |
| Memorial Wall | `memorial.html` | Animals people have added, plus the form to add one |
| Grief Support | `resources.html` | Pet loss hotlines, groups and counselling |

---

## The three things to do first

### 1. Write your own words

Every place that should sound like you is marked with a dashed green box on the page.
Search the HTML files for `placeholder` and you will find them all. Each one has a
comment above it starting with `KATRINA:` telling you what belongs there.

To fill one in, delete the whole `<div class="placeholder">...</div>` block and put
your text in its place, like this:

```html
<p>Your sentence goes here.</p>
```

The boxes are deliberately obvious so nothing half finished slips by unnoticed.
There are placeholders on the home page (introduction, three work descriptions,
your process, contact details) and one on the resources page.

The line under the title on the home page is taken from your Instagram bio.
Change it in `index.html` if you would rather say it differently.

### 2. Add your photos

Instagram does not let a website read photos from a profile without you signing
in and authorising it, so photos live in the repository instead.

1. Save your images into `assets/img/work/`
2. Open `data/gallery.json` and add one line per photo inside `items`

```json
{ "src": "assets/img/work/oak-ring.jpg", "category": "animal", "alt": "A ring with fur set in clear resin", "caption": "Fur keepsake" }
```

- `category` is one of `animal`, `human`, `milk`
- `alt` is a short plain description read aloud to blind visitors. Worth writing.
- `caption` shows when someone hovers the photo
- put `"feature": true` on one photo to use it in the large frame on the home page

Resize photos to around 1600px on the long edge before adding them, so pages stay quick.

Until you add photos, the gallery shows a tidy "no photos yet" panel rather than
anything broken.

### 3. Connect the memorial form

The form on `memorial.html` needs somewhere to send submissions. It is currently
switched off, and it says so on the page, so nobody writes something heartfelt
into a form that throws it away.

1. Make a free account at [formspree.io](https://formspree.io)
2. Create a form and copy the endpoint, which looks like `https://formspree.io/f/abcdwxyz`
3. In `memorial.html`, find `data-endpoint="https://formspree.io/f/YOUR_FORM_ID"`
   and replace the whole URL with yours

The setup warning disappears and the form switches on by itself once that is done.

The free tier covers 50 submissions a month.

---

## Adding an animal to the memorial wall

Submissions come to your email. Nothing appears on the site until you put it there,
so you always see it first.

1. Open `data/memorials.json`
2. Add an entry inside `entries`

```json
{
  "id": "bella-2024",
  "name": "Bella",
  "years": "2011 - 2024",
  "words": "She met me at the door every single day for thirteen years.",
  "from": "Sam",
  "photo": "assets/img/memorial/bella.jpg",
  "alt": "A tan terrier asleep in a patch of sun"
}
```

Only `name` is essential. If there is no photo, a small paw mark is shown instead.

`id` must be unique and must never change once it is live. It is what keeps a
visitor's lit candle attached to the right animal.

If someone emails a photo, save it into `assets/img/memorial/` and point `photo` at it.

**Lighting a candle** is saved on the visitor's own device, so it stays lit when they
come back. It is a private gesture rather than a public counter, so there is no number
to be gamed and nothing to moderate.

---

## Colours and type

Set once at the top of `assets/css/style.css`, so changing a value there changes it
everywhere.

| Token | Value | Where it shows |
| --- | --- | --- |
| `--forest-deep` | `#16281f` | Hero, banners, footer |
| `--forest` | `#24402f` | Buttons, headings |
| `--sage` | `#9caf88` | Borders, marks, icons |
| `--sage-ink` | `#5c7352` | Small sage text, so it stays readable |
| `--sage-mist` | `#eef1e9` | Soft panel backgrounds |
| `--cream` | `#faf9f5` | Page background |
| `--gold` | `#d9c89e` | Firefly particles, italic accents |

Every text colour on the site clears the WCAG AA contrast floor against the surface
it actually sits on, checked against rendered colours rather than intended ones.
That is why there are only two grey-green text weights: a third, fainter one cannot
reach 4.5:1 on a cream background. Use `--sage` for decoration and `--sage-ink`
whenever the sage is carrying words.

Type is Cormorant Garamond for headings and Jost for everything else, both from
Google Fonts.

There are no small labels above headings anywhere. If a heading seems to need one,
the heading needs rewriting instead.

## The particles

`assets/js/particles.js` draws the drifting light. Any `<canvas>` with a
`data-particles` attribute gets a field: `default` for the hero, `sparse` for page
headers, `band` for the green bands, and `pale` for light sections.

`pale` is a different animal. On a dark ground the motes add light; on cream there
is no light left to add, so that preset lays darker pollen down instead and drops
the fireflies, which only read as smudges on a pale surface.

It is built to stay out of the way. Glow is drawn from one pre-rendered sprite
rather than a fresh gradient per particle, fields stop animating when scrolled off
screen or when the tab is hidden, and anyone whose system asks for reduced motion
gets a still frame instead of movement.

To make it busier or calmer, change `density` and `max` in the `boot` function.

## Running it locally

Any static server works. With Node installed:

```bash
npx serve .
```

Opening `index.html` straight from the file system mostly works, but the gallery and
memorial wall will look empty, because browsers block reading local JSON files that way.

---

## Notes

- `.nojekyll` tells GitHub Pages to serve the files as they are.
- There is no tracking or analytics on the site.
- Add a 1200x630 share image at `assets/img/og.jpg` and uncomment the `og:image`
  line in each page's `<head>` to control how links look when shared.
- The grief support listings were checked when the site was built. Phone numbers and
  organisations do change, so they are worth a glance once a year.
