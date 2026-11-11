/* ==========================================================================
   Lunex — shared script
   Header, mobile menu, scroll reveal, orbit animation, service tabs,
   FAQ accordion, contact form validation (front-end only), footer year.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Moon phase helper ----------
     p = 0 (new moon) … 1 (full moon). Returns an SVG path for the lit part
     of a circle centred at 50,50 with radius 46 (waxing: lit from the right). */
  function moonPath(p) {
    p = Math.max(0, Math.min(1, p));
    var r = 46, rx = Math.max(0.01, r * Math.abs(1 - 2 * p));
    var sweep = p < 0.5 ? 0 : 1;
    return "M50 4 A46 46 0 0 1 50 96 A" + rx.toFixed(2) + " 46 0 0 " + sweep + " 50 4Z";
  }
  function phaseName(p) {
    if (p < 0.04) return "New moon";
    if (p < 0.4) return "Waxing crescent";
    if (p < 0.6) return "First quarter";
    if (p < 0.96) return "Waxing gibbous";
    return "Full moon";
  }
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.querySelector(".nav__menu");

  /* ---------- Header state ---------- */
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    document.addEventListener("click", function (e) {
      if (menu.classList.contains("is-open") && !e.target.closest(".nav")) closeMenu();
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) closeMenu(); });
  }

  /* ---------- Active nav link ---------- */
  var page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav__menu a").forEach(function (link) {
    if (link.getAttribute("href") === page) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* ---------- Intro (first visit) & eclipse page transitions ---------- */
  var root = document.documentElement;
  var revealDelay = 0;
  function store(key, val) {
    try { if (val === undefined) return sessionStorage.getItem(key); if (val === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, val); } catch (e) { return null; }
  }
  var MOON_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path class="intro__crescent" d="M20.561 9.061 A17 17 0 1 0 38.939 27.439 A13 13 0 0 1 20.561 9.061Z" fill="#4C6EF5"/><circle class="intro__dot" cx="36" cy="12" r="4.5" fill="#22D3EE"/></svg>';

  if (root.classList.contains("intro-pending")) {
    store("lx-intro", "1");
    var intro = document.createElement("div");
    intro.className = "intro";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML = '<div class="intro__stage"><div class="intro__moon"><span class="intro__ring"></span>' + MOON_ICON +
      '</div><img class="intro__word" src="assets/img/lunex-logo-white.svg" alt=""></div>';
    document.body.appendChild(intro);
    root.classList.remove("intro-pending");
    revealDelay = 1500;
    setTimeout(function () { intro.classList.add("is-done"); }, 1500);
    setTimeout(function () { intro.remove(); }, 2500);
  } else if (root.classList.contains("page-entering")) {
    store("lx-trans", null);
    var enter = document.createElement("div");
    enter.className = "eclipse";
    enter.style.clipPath = "circle(150% at 50% 50%)";
    enter.innerHTML = '<img src="assets/img/lunex-icon.svg" alt="">';
    document.body.appendChild(enter);
    root.classList.remove("page-entering");
    revealDelay = 250;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { enter.style.clipPath = "circle(0% at 50% 50%)"; });
    });
    setTimeout(function () { enter.remove(); }, 800);
  }

  if (!reduceMotion) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|https?:|javascript:)/i.test(href)) return;
      if (!/\.html(\?|#|$)/i.test(href)) return;
      var url = new URL(a.href, location.href);
      if (url.pathname === location.pathname && url.hash) return; // same-page anchor
      e.preventDefault();
      store("lx-trans", "1");
      var x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2;
      var ec = document.createElement("div");
      ec.className = "eclipse";
      ec.style.clipPath = "circle(0px at " + x + "px " + y + "px)";
      ec.innerHTML = '<img src="assets/img/lunex-icon.svg" alt="">';
      document.body.appendChild(ec);
      void ec.offsetWidth;
      ec.style.clipPath = "circle(150% at " + x + "px " + y + "px)";
      setTimeout(function () { location.href = a.href; }, 520);
    });
    // coming back with the browser's Back button: clear any leftover cover
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) {
        document.querySelectorAll(".eclipse").forEach(function (el) { el.remove(); });
        store("lx-trans", null);
      }
    });
  }

  /* ---------- Headlines rise in word by word ---------- */
  var splitEls = [];
  if (!reduceMotion) {
    var wrapWord = function (node, i) {
      var w = document.createElement("span"); w.className = "w";
      var inner = document.createElement("span"); inner.className = "w__i";
      inner.style.transitionDelay = (i * 70) + "ms";
      inner.appendChild(node); w.appendChild(inner);
      return w;
    };
    document.querySelectorAll("main h1, main h2").forEach(function (h) {
      if (h.closest("[data-no-split]")) return;
      var frag = document.createDocumentFragment(), i = 0;
      Array.prototype.slice.call(h.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else frag.appendChild(wrapWord(document.createTextNode(part), i++));
          });
        } else if (n.nodeName === "BR") {
          frag.appendChild(n);
        } else {
          frag.appendChild(wrapWord(n, i++));
        }
      });
      h.textContent = "";
      h.appendChild(frag);
      h.classList.remove("reveal", "d1", "d2", "d3");
      h.classList.add("split");
      splitEls.push(h);
    });
  }

  /* ---------- Paired blocks slide in from opposite sides ---------- */
  [".svc__grid", ".mv", ".contact-grid", ".facts-wrap", ".story"].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        if (child.classList.contains("reveal")) child.classList.add(i % 2 ? "from-right" : "from-left");
      });
    });
  });
  document.querySelectorAll(".info > .reveal").forEach(function (el) { el.classList.add("from-right"); });

  /* ---------- Scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal")).concat(splitEls);
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    setTimeout(function () { revealEls.forEach(function (el) { io.observe(el); }); }, revealDelay);
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Orbit: clouds circling the Lunex moon ----------
     Each .sat has data-ring ("inner" | "outer") and data-angle (degrees).
     Satellites on the far side of the ellipse sit behind the moon.      */
  var orbit = document.querySelector("[data-orbit]");
  if (orbit && !reduceMotion) {
    var sats = Array.prototype.slice.call(orbit.querySelectorAll(".sat"));
    var rings = {
      inner: orbit.querySelector(".orbit__ring--inner"),
      outer: orbit.querySelector(".orbit__ring--outer")
    };
    var size = {};
    function measure() {
      var box = orbit.getBoundingClientRect();
      size.cx = box.width / 2;
      size.cy = box.height / 2;
      ["inner", "outer"].forEach(function (k) {
        var r = rings[k].getBoundingClientRect();
        size[k] = { a: r.width / 2, b: r.height / 2 };
      });
    }
    measure();
    window.addEventListener("resize", measure);
    orbit.classList.add("is-live");

    var speed = { inner: 0.00011, outer: -0.00007 }; // radians per ms
    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(orbit);
    }

    // slow the orbit to a drift while the visitor hovers or tabs into it
    var clock = 0, lastT = null, factor = 1, target = 1;
    orbit.addEventListener("mouseenter", function () { target = 0.12; });
    orbit.addEventListener("mouseleave", function () { target = 1; });
    orbit.addEventListener("focusin", function () { target = 0; });
    orbit.addEventListener("focusout", function () { target = 1; });

    function frame(t) {
      if (lastT === null) lastT = t;
      var dt = Math.min(64, t - lastT);
      lastT = t;
      factor += (target - factor) * 0.06;
      clock += dt * factor;
      if (visible) {
        sats.forEach(function (s) {
          var ring = s.getAttribute("data-ring");
          var base = parseFloat(s.getAttribute("data-angle")) * Math.PI / 180;
          var th = base + clock * speed[ring];
          var e = size[ring];
          var x = size.cx + e.a * Math.cos(th);
          var y = size.cy + e.b * Math.sin(th);
          var depth = Math.sin(th);                 // -1 = back, 1 = front
          var scale = 0.82 + 0.18 * (depth + 1) / 2;
          s.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) translate(-50%,-50%) scale(" + scale.toFixed(3) + ")";
          s.style.zIndex = depth < 0 ? 1 : 3;
          s.style.opacity = (0.55 + 0.45 * (depth + 1) / 2).toFixed(2);
        });
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Tabs (mission control) ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (!panel) return;
        panel.hidden = !on;
        if (on) {
          panel.classList.remove("is-entering");
          void panel.offsetWidth;
          panel.classList.add("is-entering");
        }
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });

  /* ---------- Scroll-spy for the services side index ---------- */
  var spyLinks = document.querySelectorAll(".svc-nav a");
  if (spyLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    spyLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(function (a) { a.classList.remove("is-current"); });
        var link = byId[entry.target.id];
        if (link) link.classList.add("is-current");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(byId).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      var answer = document.getElementById(btn.getAttribute("aria-controls"));
      document.querySelectorAll(".faq__q[aria-expanded='true']").forEach(function (other) {
        if (other === btn) return;
        other.setAttribute("aria-expanded", "false");
        var a = document.getElementById(other.getAttribute("aria-controls"));
        if (a) a.style.maxHeight = null;
      });
      btn.setAttribute("aria-expanded", String(!expanded));
      if (answer) answer.style.maxHeight = expanded ? null : answer.scrollHeight + "px";
    });
  });

  /* ---------- Contact form (front-end only) ----------
     Validates fields and shows a success message. No data is sent.
     To receive emails later, point the form's action at a service such
     as Formspree and remove e.preventDefault().                         */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var phoneRe = /^[+\d][\d\s-]{6,}$/;
    var fields = form.querySelectorAll("input, select, textarea");

    function setError(field, msg) {
      var err = form.querySelector('[data-error-for="' + field.name + '"]');
      field.classList.toggle("is-invalid", !!msg);
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
    }
    function validate(field) {
      var v = field.value.trim();
      if (field.required && !v) return "This field is required.";
      if (field.type === "email" && v && !emailRe.test(v)) return "Please enter a valid email address.";
      if (field.type === "tel" && v && !phoneRe.test(v)) return "Please enter a valid phone number.";
      return "";
    }
    fields.forEach(function (f) {
      f.addEventListener("blur", function () { setError(f, validate(f)); });
      f.addEventListener("input", function () { if (f.classList.contains("is-invalid")) setError(f, validate(f)); });
    });

    /* Moon that fills up as required fields are completed */
    var formMoon = document.querySelector("[data-form-moon]");
    var formMoonLit = formMoon && formMoon.querySelector(".moon-lit");
    var formMoonLabel = formMoon && formMoon.querySelector("small");
    var required = Array.prototype.filter.call(fields, function (f) { return f.required; });
    function updateMoon() {
      if (!formMoon) return;
      var done = required.filter(function (f) { return f.value.trim() && !validate(f); }).length;
      var p = required.length ? done / required.length : 0;
      formMoonLit.setAttribute("d", moonPath(p));
      formMoon.classList.toggle("is-full", p === 1);
      formMoonLabel.textContent = p === 1 ? "Ready for launch" : Math.round(p * 100) + "% in orbit";
    }
    fields.forEach(function (f) {
      f.addEventListener("input", updateMoon);
      f.addEventListener("change", updateMoon);
    });
    updateMoon();

    /* Character counter for the message box */
    var msg = form.querySelector("#message");
    var msgCount = form.querySelector("[data-msg-count]");
    if (msg && msgCount) {
      var countMsg = function () { msgCount.textContent = msg.value.length + " characters"; };
      msg.addEventListener("input", countMsg);
      countMsg();
    }

    /* Quick topic chips fill in the "What do you need help with?" field */
    var topicSel = form.querySelector("#topic");
    document.querySelectorAll("[data-topic]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll("[data-topic]").forEach(function (c) { c.classList.remove("is-on"); });
        chip.classList.add("is-on");
        if (topicSel) {
          topicSel.value = chip.getAttribute("data-topic");
          setError(topicSel, "");
          updateMoon();
        }
        if (msg) msg.focus();
      });
    });

    /* Pre-fill from links like contact.html?cloud=AWS&topic=Migration */
    var params = new URLSearchParams(location.search);
    function preselect(sel, value) {
      if (!sel || !value) return false;
      var opt = Array.prototype.find.call(sel.options, function (o) {
        return (o.value || o.text).toLowerCase() === value.toLowerCase();
      });
      if (opt) { sel.value = opt.value || opt.text; return true; }
      return false;
    }
    var gotCloud = preselect(form.querySelector("#cloud"), params.get("cloud"));
    var gotTopic = preselect(topicSel, params.get("topic"));
    if (gotTopic) {
      document.querySelectorAll("[data-topic]").forEach(function (c) {
        c.classList.toggle("is-on", c.getAttribute("data-topic") === topicSel.value);
      });
    }
    if (gotCloud || gotTopic) {
      updateMoon();
      var hint = document.querySelector("[data-prefill-note]");
      if (hint) {
        var bits = [];
        if (gotCloud) bits.push(params.get("cloud"));
        if (gotTopic) bits.push(topicSel.value);
        hint.textContent = "We've filled in: " + bits.join(" · ") + ". Change it if you like.";
        hint.hidden = false;
      }
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;
      fields.forEach(function (f) {
        var msg = validate(f);
        setError(f, msg);
        if (msg && !firstInvalid) firstInvalid = f;
      });
      var success = form.querySelector(".form__success");
      if (firstInvalid) {
        if (success) success.classList.remove("is-visible");
        firstInvalid.focus();
        return;
      }
      /* Open the visitor's own email app with the enquiry ready to send
         to Lunex. (No server needed; they just press Send.) */
      var val = function (id) { var el = form.querySelector("#" + id); return el ? el.value.trim() : ""; };
      var lines = [
        "Name: " + val("name"),
        "Company: " + (val("company") || "-"),
        "Email: " + val("email"),
        "Phone / WhatsApp: " + (val("phone") || "-"),
        "Cloud: " + (val("cloud") || "Not sure yet"),
        "Topic: " + val("topic"),
        "",
        "Message:",
        val("message"),
        "",
        "(Sent from the contact form on the Lunex website)"
      ];
      var subject = "Website enquiry: " + val("topic") + " (" + val("name") + ")";
      window.location.href = "mailto:" + (form.getAttribute("data-to") || "support@lunexsb.com") +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\r\n"));

      if (formMoon && !reduceMotion) {
        formMoon.classList.add("is-launch");
        setTimeout(function () { formMoon.classList.remove("is-launch"); updateMoon(); }, 1500);
      }
      form.reset();
      document.querySelectorAll("[data-topic]").forEach(function (c) { c.classList.remove("is-on"); });
      if (msg && msgCount) msgCount.textContent = "0 characters";
      if (reduceMotion || !formMoon) updateMoon();
      if (success) { success.classList.add("is-visible"); success.focus(); }
    });
  }

  /* ---------- Cloud logos (services page) ----------
     If a logo file exists, show it on a white disc; if not, remove the
     <img> so the coloured planet stays as the fallback.                 */
  document.querySelectorAll(".planet__orb img").forEach(function (img) {
    var orb = img.parentNode;
    function ok() { orb.classList.add("has-logo"); }
    function fail() { img.remove(); orb.setAttribute("aria-hidden", "true"); }
    if (img.complete) { (img.naturalWidth > 0 ? ok : fail)(); }
    else {
      img.addEventListener("load", ok);
      img.addEventListener("error", fail);
    }
  });

  /* ---------- Mouse-follow spotlight on cards ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-spotlight]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
      el.addEventListener("mouseleave", function () {
        el.style.setProperty("--mx", "-999px");
        el.style.setProperty("--my", "-999px");
      });
    });
  }

  /* ---------- Cloud matchmaker (services page) ---------- */
  var match = document.querySelector("[data-match]");
  if (match) {
    var CLOUDS = {
      aws:      { name: "AWS",           logo: "aws.svg",           c: "#ff9900", why: "the widest choice of services and regions, so it rarely limits what you can build" },
      gcp:      { name: "Google Cloud",  logo: "google-cloud.svg",  c: "#4285f4", why: "excellent data, analytics and AI tools on a fast global network" },
      ali:      { name: "Alibaba Cloud", logo: "alibaba-cloud.svg", c: "#ff6a00", why: "strong coverage across Asia and the smoothest route into mainland China" },
      tencent:  { name: "Tencent Cloud", logo: "tencent-cloud.svg", c: "#2f7cf6", why: "proven infrastructure for games, live video and real-time apps" },
      huawei:   { name: "Huawei Cloud",  logo: "huawei-cloud.svg",  c: "#e60012", why: "solid hybrid options for businesses that also run their own servers" },
      byteplus: { name: "BytePlus",      logo: "byteplus.png",      c: "#22d3ee", why: "ByteDance's recommendation, video and AI technology, built for consumer apps" }
    };
    // points each answer gives each cloud
    var SCORES = {
      web:     { aws: 2, ali: 2, gcp: 1, tencent: 1, huawei: 1 },
      live:    { tencent: 3, byteplus: 2, aws: 1, ali: 1 },
      data:    { gcp: 3, aws: 1, byteplus: 1, ali: 1 },
      biz:     { huawei: 2, aws: 2, ali: 1, gcp: 1 },
      sea:     { aws: 1, ali: 1, gcp: 1, tencent: 1, huawei: 1, byteplus: 1 },
      china:   { ali: 3, tencent: 2, huawei: 1 },
      global:  { aws: 2, gcp: 2, byteplus: 1 },
      cost:    { ali: 1, tencent: 1, huawei: 1 },
      easy:    { aws: 1, gcp: 1 },
      tech:    { gcp: 1, byteplus: 1, aws: 1, tencent: 1 },
      hybrid:  { huawei: 3, aws: 1 }
    };
    var ORDER = ["aws", "gcp", "ali", "tencent", "huawei", "byteplus"];
    var steps = Array.prototype.slice.call(match.querySelectorAll(".match__q"));
    var dots = match.querySelectorAll(".match__steps span");
    var result = match.querySelector(".match__result");
    var back = match.querySelector(".match__back");
    var answers = [];
    var labels = [];

    function animateIn(el) {
      el.classList.remove("is-entering"); void el.offsetWidth; el.classList.add("is-entering");
    }
    function showStep(i) {
      steps.forEach(function (s, j) { s.hidden = j !== i; });
      result.hidden = true;
      back.hidden = i === 0;
      dots.forEach(function (d, j) {
        d.classList.toggle("is-done", j < i);
        d.classList.toggle("is-half", j === i);
      });
      animateIn(steps[i]);
    }
    function showResult() {
      var total = {};
      ORDER.forEach(function (k) { total[k] = 0; });
      answers.forEach(function (a) {
        var s = SCORES[a] || {};
        Object.keys(s).forEach(function (k) { total[k] += s[k]; });
      });
      var ranked = ORDER.slice().sort(function (a, b) { return total[b] - total[a]; });
      var top = CLOUDS[ranked[0]], alt = CLOUDS[ranked[1]];
      result.innerHTML =
        '<p class="match__count">Your match</p>' +
        '<div class="match__logo" style="--c:' + top.c + '"><img src="assets/img/clouds/' + top.logo + '" alt="' + top.name + ' logo"></div>' +
        '<h3><span>Start with</span>' + top.name + '</h3>' +
        '<p>For ' + labels[0] + ', with users mainly ' + labels[1] + ', ' + top.name + ' gives you ' + top.why + '.</p>' +
        '<p class="match__alt">Also worth a look: <strong>' + alt.name + '</strong>, for ' + alt.why + '.</p>' +
        '<div class="match__actions">' +
          '<a class="btn btn--primary" href="contact.html?cloud=' + encodeURIComponent(top.name) + '&topic=' + encodeURIComponent("Architecture advice") + '">Confirm it in a free call</a>' +
          '<button class="btn btn--line" type="button" data-match-restart>Start again</button>' +
        '</div>' +
        '<p class="match__note">This is a quick starting point, not a final answer. Real recommendations depend on your workload and budget.</p>';
      steps.forEach(function (s) { s.hidden = true; });
      result.hidden = false;
      back.hidden = false;
      dots.forEach(function (d) { d.classList.add("is-done"); d.classList.remove("is-half"); });
      animateIn(result);
      // fall back gracefully if a logo file is missing
      var img = result.querySelector("img");
      img.addEventListener("error", function () { img.parentNode.remove(); });
      result.querySelector("[data-match-restart]").addEventListener("click", function () {
        answers = []; labels = [];
        match.querySelectorAll(".match__opt").forEach(function (o) { o.classList.remove("is-picked"); });
        showStep(0);
      });
    }
    steps.forEach(function (step, i) {
      step.querySelectorAll(".match__opt").forEach(function (opt) {
        opt.addEventListener("click", function () {
          step.querySelectorAll(".match__opt").forEach(function (o) { o.classList.remove("is-picked"); });
          opt.classList.add("is-picked");
          answers[i] = opt.getAttribute("data-value");
          labels[i] = opt.getAttribute("data-label");
          setTimeout(function () {
            if (i < steps.length - 1) showStep(i + 1); else showResult();
          }, reduceMotion ? 0 : 220);
        });
      });
    });
    back.addEventListener("click", function () {
      var current = result.hidden ? steps.findIndex(function (s) { return !s.hidden; }) : steps.length;
      showStep(Math.max(0, current - 1));
    });
    showStep(0);
  }

  /* ---------- Moon that waxes as you scroll (about page) ---------- */
  var scrollMoon = document.querySelector("[data-scroll-moon]");
  if (scrollMoon) {
    var lit = scrollMoon.querySelector(".moon-lit");
    var label = document.querySelector("[data-moon-label]");
    var track = scrollMoon.closest("section");
    var ticking = false;
    function paintMoon() {
      ticking = false;
      var r = track.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.75 - r.top) / (r.height);
      p = Math.max(0, Math.min(1, p));
      lit.setAttribute("d", moonPath(p));
      if (label) label.textContent = phaseName(p);
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paintMoon); }
    }, { passive: true });
    window.addEventListener("resize", paintMoon);
    paintMoon();
  }

  /* ---------- "Luna + nexus" → "Lunex" (about page) ---------- */
  var merge = document.querySelector("[data-merge]");
  if (merge) {
    var doMerge = function () { merge.classList.add("is-merged"); };
    if ("IntersectionObserver" in window && !reduceMotion) {
      var mo = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { setTimeout(doMerge, 600); mo.disconnect(); }
      }, { threshold: 0.8 });
      mo.observe(merge);
    } else {
      doMerge();
    }
    merge.addEventListener("click", function () { merge.classList.toggle("is-merged"); });
  }

  /* ---------- Live Kuala Lumpur sky (contact page) ---------- */
  var sky = document.querySelector("[data-kl-sky]");
  if (sky) {
    var TZ = "Asia/Kuala_Lumpur";
    var body = sky.querySelector(".sky__body");
    var timeEl = sky.querySelector(".sky__time");
    var metaEl = sky.querySelector(".sky__meta");
    var fmtTime = new Intl.DateTimeFormat("en-MY", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
    var fmtParts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", weekday: "long", hour12: false });

    function paintSky() {
      var now = new Date();
      var parts = {};
      fmtParts.formatToParts(now).forEach(function (p) { parts[p.type] = p.value; });
      var h = (parseInt(parts.hour, 10) % 24) + parseInt(parts.minute, 10) / 60;

      var period = h < 5.5 ? "night" : h < 7.5 ? "dawn" : h < 18 ? "day" : h < 19.75 ? "dusk" : "night";
      sky.setAttribute("data-period", period);

      var isSun = h >= 6 && h < 19;
      var t = isSun ? (h - 6) / 13 : ((h - 19 + 24) % 24) / 11;
      t = Math.max(0, Math.min(1, t));
      body.className = "sky__body " + (isSun ? "is-sun" : "is-moon");
      body.style.left = (8 + t * 84) + "%";
      body.style.top = (82 - Math.sin(t * Math.PI) * 58) + "%";

      timeEl.textContent = fmtTime.format(now).replace(/\s?(am|pm)/i, function (m) { return " " + m.trim().toLowerCase(); });

      var diff = (480 + now.getTimezoneOffset()) / 60; // KL is UTC+8
      var rel = diff === 0 ? "Same time zone as you"
        : Math.abs(diff) + (Math.abs(diff) === 1 ? " hour " : " hours ") + (diff > 0 ? "ahead of you" : "behind you");
      metaEl.textContent = parts.weekday + " in Kuala Lumpur · " + rel;
    }
    paintSky();
    setInterval(paintSky, 30000);
  }

  /* ---------- Starfield with shooting stars (all pages) ---------- */
  (function starfield() {
    var c = document.createElement("canvas");
    c.className = "starfield";
    c.setAttribute("aria-hidden", "true");
    document.body.prepend(c);
    var ctx = c.getContext("2d");
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, stars = [], shooters = [], nextShot = 0, running = true;

    function build() {
      W = window.innerWidth; H = window.innerHeight;
      c.width = W * dpr; c.height = H * dpr;
      c.style.width = W + "px"; c.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(170, Math.round(W * H / 8500));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() < 0.12 ? 1.3 + Math.random() * 0.6 : 0.4 + Math.random() * 0.7,
          a: 0.25 + Math.random() * 0.6, sp: 0.6 + Math.random() * 1.8, ph: Math.random() * 6.28,
          d: 0.03 + Math.random() * 0.12, blue: Math.random() < 0.25
        });
      }
    }
    function drawStars(t) {
      ctx.clearRect(0, 0, W, H);
      var sy = window.scrollY;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var y = ((s.y - sy * s.d) % H + H) % H;
        var tw = reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(t / 1000 * s.sp + s.ph);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = s.blue ? "#a9bbff" : "#ffffff";
        ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function drawShooters(t, dt) {
      if (t > nextShot) {
        shooters.push({ x: W * (0.3 + Math.random() * 0.7), y: H * Math.random() * 0.45, life: 0, max: 900 + Math.random() * 400,
                        vx: -(0.75 + Math.random() * 0.4), vy: 0.32 + Math.random() * 0.2 });
        nextShot = t + 4500 + Math.random() * 6000;
      }
      for (var i = shooters.length - 1; i >= 0; i--) {
        var s = shooters[i];
        s.life += dt;
        var k = s.life / s.max;
        if (k >= 1) { shooters.splice(i, 1); continue; }
        var hx = s.x + s.vx * s.life, hy = s.y + s.vy * s.life;
        var len = 140 * Math.sin(k * Math.PI);
        var tx = hx - s.vx * len / Math.hypot(s.vx, s.vy), ty = hy - s.vy * len / Math.hypot(s.vx, s.vy);
        var g = ctx.createLinearGradient(hx, hy, tx, ty);
        g.addColorStop(0, "rgba(255,255,255," + (0.9 * (1 - k)) + ")");
        g.addColorStop(0.3, "rgba(34,211,238," + (0.5 * (1 - k)) + ")");
        g.addColorStop(1, "rgba(76,110,245,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
      }
    }
    build();
    window.addEventListener("resize", build);
    if (reduceMotion) {
      drawStars(0);
      window.addEventListener("scroll", function () { drawStars(0); }, { passive: true });
      window.addEventListener("resize", function () { drawStars(0); });
      return;
    }
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) { last = performance.now(); requestAnimationFrame(loop); }
    });
    var last = performance.now();
    nextShot = last + 2000;
    function loop(t) {
      if (!running) return;
      var dt = Math.min(64, t - last); last = t;
      drawStars(t);
      drawShooters(t, dt);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  /* ---------- Cursor glow + stardust trail (desktop only) ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    dot.setAttribute("aria-hidden", "true");
    var trail = document.createElement("canvas");
    trail.className = "trail";
    trail.setAttribute("aria-hidden", "true");
    document.body.appendChild(trail);
    document.body.appendChild(dot);
    var tctx = trail.getContext("2d");
    var tdpr = Math.min(window.devicePixelRatio || 1, 2);
    var sizeTrail = function () {
      trail.width = innerWidth * tdpr; trail.height = innerHeight * tdpr;
      trail.style.width = innerWidth + "px"; trail.style.height = innerHeight + "px";
      tctx.setTransform(tdpr, 0, 0, tdpr, 0, 0);
    };
    sizeTrail();
    window.addEventListener("resize", sizeTrail);

    var mx = -100, my = -100, dx = -100, dy = -100, lastPX = 0, lastPY = 0;
    var dust = [], trailRunning = false, prevT = 0;
    var INTERACTIVE = "a, button, select, input, textarea, label, [role='tab'], .merge";

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.classList.add("is-visible");
      if (Math.hypot(mx - lastPX, my - lastPY) > 7) {
        lastPX = mx; lastPY = my;
        dust.push({ x: mx, y: my, vx: (Math.random() - 0.5) * 0.04, vy: 0.02 + Math.random() * 0.04,
                    r: 0.8 + Math.random() * 1.6, life: 0, max: 600 + Math.random() * 400, cyan: Math.random() < 0.5 });
        if (dust.length > 80) dust.shift();
        if (!trailRunning) { trailRunning = true; prevT = performance.now(); requestAnimationFrame(trailLoop); }
      }
    }, { passive: true });
    document.addEventListener("mouseover", function (e) {
      dot.classList.toggle("is-hover", !!e.target.closest(INTERACTIVE));
    });
    document.addEventListener("mousedown", function () { dot.classList.add("is-down"); });
    document.addEventListener("mouseup", function () { dot.classList.remove("is-down"); });
    document.documentElement.addEventListener("mouseleave", function () { dot.classList.remove("is-visible"); });

    (function follow() {
      dx += (mx - dx) * 0.22; dy += (my - dy) * 0.22;
      dot.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      requestAnimationFrame(follow);
    })();

    var trailLoop = function (t) {
      var dt = Math.min(64, t - prevT); prevT = t;
      tctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = dust.length - 1; i >= 0; i--) {
        var p = dust[i];
        p.life += dt;
        var k = p.life / p.max;
        if (k >= 1) { dust.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        tctx.globalAlpha = (1 - k) * 0.85;
        tctx.fillStyle = p.cyan ? "#22d3ee" : "#91a7ff";
        tctx.beginPath(); tctx.arc(p.x, p.y, p.r * (1 - k * 0.5), 0, 6.283); tctx.fill();
      }
      tctx.globalAlpha = 1;
      if (dust.length) requestAnimationFrame(trailLoop); else trailRunning = false;
    };
  }

  /* ---------- 3D tilt on cards (desktop only) ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".planet, .mv__card, .info__item, .svc__box, .why__item, .phase, .value").forEach(function (card) {
      var max = card.classList.contains("svc__box") ? 4 : 8;
      var lift = card.classList.contains("planet") ? " translateY(-4px)" : "";
      card.classList.add("tilt");
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add("is-tilting"); card.classList.remove("is-resetting");
        card.style.transform = "perspective(900px) rotateX(" + (-py * max).toFixed(2) + "deg) rotateY(" + (px * max).toFixed(2) + "deg)" + lift;
      });
      card.addEventListener("mouseleave", function () {
        card.classList.remove("is-tilting"); card.classList.add("is-resetting");
        card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
        setTimeout(function () {
          if (!card.classList.contains("is-tilting")) { card.style.transform = ""; card.classList.remove("is-resetting"); }
        }, 600);
      });
    });
  }

  /* ---------- Scroll progress bar with a waxing moon ---------- */
  (function progress() {
    var bar = document.createElement("div");
    bar.className = "scrollbar";
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = '<div class="scrollbar__fill"></div><svg class="scrollbar__moon" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#13214a" stroke="#91a7ff" stroke-width="4"/><path class="moon-lit" fill="#dbe3ff" d=""/></svg>';
    document.body.appendChild(bar);
    var fill = bar.querySelector(".scrollbar__fill");
    var moon = bar.querySelector(".scrollbar__moon");
    var litPath = moon.querySelector(".moon-lit");
    var queued = false;
    function update() {
      queued = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      fill.style.width = (p * 100) + "%";
      moon.style.left = Math.max(8, Math.min(innerWidth - 8, p * innerWidth)) + "px";
      litPath.setAttribute("d", moonPath(p));
      bar.style.opacity = max > 200 ? 1 : 0;
    }
    window.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
