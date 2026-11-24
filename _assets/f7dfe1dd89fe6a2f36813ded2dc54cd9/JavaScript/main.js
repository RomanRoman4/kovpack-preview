(() => {
"use strict";
const wideMenu = window.matchMedia('(min-width: 1280px) and (hover: hover)');

const body         = document.body;
const menuButtons  = document.querySelectorAll('.JS_header-menu-button');
const nav          = document.getElementById('navigation');
const subnavLinks  = document.querySelectorAll('.JS_header_subnav_link');
const languageDropdowns = document.querySelectorAll('.JS_header-language-dropdown');

if (menuButtons.length && nav) {
  const closeLanguageDropdown = languageDropdown => {
    const button = languageDropdown.querySelector('.JS_header-language-button');
    const menu = languageDropdown.querySelector('.JS_header-language-menu');

    languageDropdown.classList.remove('header__language-dropdown--open');

    if (button instanceof HTMLButtonElement) {
      button.setAttribute('aria-expanded', 'false');
    }

    if (menu instanceof HTMLElement) {
      menu.setAttribute('aria-hidden', 'true');
    }
  };

  const openLanguageDropdown = languageDropdown => {
    const button = languageDropdown.querySelector('.JS_header-language-button');
    const menu = languageDropdown.querySelector('.JS_header-language-menu');

    languageDropdown.classList.add('header__language-dropdown--open');

    if (button instanceof HTMLButtonElement) {
      button.setAttribute('aria-expanded', 'true');
    }

    if (menu instanceof HTMLElement) {
      menu.setAttribute('aria-hidden', 'false');
    }
  };

  const closeAllLanguageDropdowns = () => {
    languageDropdowns.forEach(closeLanguageDropdown);
  };

  languageDropdowns.forEach(languageDropdown => {
    const button = languageDropdown.querySelector('.JS_header-language-button');
    const menu = languageDropdown.querySelector('.JS_header-language-menu');

    if (!(button instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) {
      return;
    }

    button.addEventListener('click', event => {
      event.preventDefault();

      const isOpen = languageDropdown.classList.contains('header__language-dropdown--open');
      closeAllLanguageDropdowns();

      if (!isOpen) {
        openLanguageDropdown(languageDropdown);
      }
    });

    languageDropdown.addEventListener('focusout', event => {
      const nextTarget = event.relatedTarget;
      if (!(nextTarget instanceof Node) || !languageDropdown.contains(nextTarget)) {
        closeLanguageDropdown(languageDropdown);
      }
    });
  });

  document.addEventListener('click', event => {
    const clickTarget = event.target;
    if (!(clickTarget instanceof Node)) {
      return;
    }

    languageDropdowns.forEach(languageDropdown => {
      if (!languageDropdown.contains(clickTarget)) {
        closeLanguageDropdown(languageDropdown);
      }
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeAllLanguageDropdowns();
    }
  });

  const updateScrollLock = () => {
    const menuOpen = nav.classList.contains('header__menu--open');
    body.style.overflow = menuOpen ? 'hidden' : '';
  };

  // menu buttons
  menuButtons.forEach(menuButton => {
    menuButton.addEventListener('click', event => {
      if (wideMenu.matches) return;
      event.preventDefault();

      nav.classList.toggle('header__menu--open');
      menuButton.classList.toggle('header__menu-button--open');
      body.classList.toggle('body--menu-open');

      updateScrollLock();
    });
  });

  // toggle subnavigation
  subnavLinks.forEach(link => {
    const subnav = document.getElementById(link.dataset.target);
    if (!subnav) return;
    const syncTrigger = () => {
      if (wideMenu.matches && link instanceof HTMLAnchorElement) {
        link.removeAttribute('aria-controls');
        link.removeAttribute('aria-expanded');
      } else {
        link.setAttribute('aria-controls', subnav.id);
        link.setAttribute('aria-expanded', String(subnav.classList.contains('header__subnav--active')));
      }
    };
    wideMenu.addEventListener('change', syncTrigger);
    syncTrigger();

    link.addEventListener('click', event => {
      if (wideMenu.matches) return;
      event.preventDefault();
      subnav.classList.toggle('header__subnav--active');
      syncTrigger();
    });
  });

  // Reset disclosures and scroll lock when switching navigation modes.
  wideMenu.addEventListener('change', () => {
    closeAllLanguageDropdowns();
    nav.classList.remove('header__menu--open');
    body.classList.remove('body--menu-open');
    body.style.overflow = '';
    menuButtons.forEach(button => button.classList.remove('header__menu-button--open'));
    nav.querySelectorAll('.JS_header-subnav.header__subnav--active').forEach(subnav => {
      subnav.classList.remove('header__subnav--active');
    });
    subnavLinks.forEach(link => {
      if (link.hasAttribute('aria-expanded')) link.setAttribute('aria-expanded', 'false');
    });
  });
}

/* Pages opened straight from disk (file://): Chrome refuses icons that point into
 * an external sprite (<use href="…/pdp-uses.svg#fill-void">), leaving empty boxes.
 * Load the sprite's JS twin (generated by tools/stamp-assets.mjs), put its symbols
 * into the page and point each icon at its local copy. Over http(s) nothing runs. */
if (location.protocol === 'file:') {
  const uses = [...document.querySelectorAll('use[href*=".svg"][href*="#"]')];
  const sprites = new Map();
  uses.forEach(use => {
    const [file] = use.getAttribute('href').split('#');
    const url = file.split('?')[0];
    if (!sprites.has(url)) sprites.set(url, []);
    sprites.get(url).push(use);
  });
  const pending = new Map([...sprites].map(([url, list]) => [url.split('/').pop(), list]));
  window.kovpackSprite = (name, markup) => {
    const list = pending.get(name);
    if (!list) return;
    pending.delete(name);
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = markup;
    document.body.prepend(holder);
    list.forEach(use => use.setAttribute('href', `#${use.getAttribute('href').split('#')[1]}`));
  };
  sprites.forEach((list, url) => {
    const script = document.createElement('script');
    script.src = url.replace(/\.svg$/, '.js');
    document.head.append(script);
  });
}

})();
