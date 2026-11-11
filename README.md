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

## Structure

```
css/style.css           shared styles
js/main.js              shared scripts (animations, matchmaker, form, etc.)
assets/img/             Lunex logo and icons
assets/img/clouds/      cloud partner logos
```

## To do before launch

- Replace the `**` placeholder for business hours. Email, phone and address are set:
  support@lunexsb.com, +60 11-1879 1260, 5, Lorong Peel, Maluri, 55100 Cheras, Wilayah Persekutuan Kuala Lumpur
- Replace the cloud logos with official files from each partner portal.
- Connect the contact form to a form service (for example Formspree) if it should send emails.
