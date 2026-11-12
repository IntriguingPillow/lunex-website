# Lunex Website

Marketing website for **Lunex**, a Malaysian multi-cloud reseller for AWS, Google Cloud,
Alibaba Cloud, Tencent Cloud, Huawei Cloud and BytePlus.

Plain HTML, CSS and JavaScript: no build step and no dependencies.

## Pages

| File | Page |
|---|---|
| `index.html` | Home |
| `services.html` | Services, cloud matchmaker, cloud partners, FAQ |
| `about.html` | About Us |
| `contact.html` | Contact Us (form is front-end only for now) |

## Run locally

Open `index.html` in a browser, or in a terminal:

```powershell
start index.html
```

## English & Bahasa Melayu

The site has an **EN | BM** switch in the top-right corner. Malay pages live in `bm/`
and are **generated** from the English pages. Don't edit `bm/*.html` by hand.

1. Edit the English page (e.g. `services.html`).
2. If you changed or added text, add/update its Malay line in `tools/i18n-ms.txt`
   (format: `English text|||Malay text`).
3. Rebuild the Malay pages:

   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\build-ms.ps1
   ```

   The script lists any English text that has no translation yet, and any
   translations that are no longer used.

Text created by JavaScript (matchmaker results, form messages, clock) is translated
inside `js/main.js` with `t("English", "Melayu")`.

## Structure

```
css/style.css           shared styles
js/main.js              shared scripts (animations, matchmaker, form, etc.)
assets/img/             Lunex logo and icons
assets/img/clouds/      cloud partner logos
```

## To do before launch

- Contact details are set: support@lunexsb.com, +60 11-1879 1260,
  5, Lorong Peel, Maluri, 55100 Cheras, Wilayah Persekutuan Kuala Lumpur; hours Mon – Fri, 9:00 am – 6:00 pm.
- Replace the cloud logos with official files from each partner portal.
- Connect the contact form to a form service (for example Formspree) if it should send emails.
