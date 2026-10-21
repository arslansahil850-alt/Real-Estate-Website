(() => {
    "use strict";

    const ready = (callback) => {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    };

    ready(() => {
        const $ = (selector, root = document) => root.querySelector(selector);
        const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

        const toast = $("#toastMessage");
        let toastTimer;

        function showToast(message) {
            if (!toast) return;

            toast.textContent = message;
            toast.classList.add("show", "active");
            toast.setAttribute("aria-hidden", "false");
            toast.style.display = "block";

            window.clearTimeout(toastTimer);

            toastTimer = window.setTimeout(() => {
                toast.classList.remove("show", "active");
                toast.setAttribute("aria-hidden", "true");
                toast.style.display = "";
            }, 3000);
        }

        function refreshIcons(root = document) {
            if (window.lucide && typeof window.lucide.createIcons === "function") {
                window.lucide.createIcons({ root });
            }
        }

        refreshIcons();

        const currentYear = $("#currentYear");

        if (currentYear) {
            currentYear.textContent = new Date().getFullYear();
        }

        const menuToggle = $("#menuToggle");
        const navMenu = $("#navMenu");

        function closeMenu() {
            if (!menuToggle || !navMenu) return;

            navMenu.classList.remove("active", "open", "show");
            menuToggle.classList.remove("active");

            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");

            const icon = $("i", menuToggle);

            if (icon) {
                icon.setAttribute("data-lucide", "menu");
            }

            refreshIcons(menuToggle);
        }

        if (menuToggle && navMenu) {
            menuToggle.addEventListener("click", () => {
                const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

                if (isOpen) {
                    closeMenu();
                } else {
                    navMenu.classList.add("active", "open");
                    menuToggle.classList.add("active");

                    menuToggle.setAttribute("aria-expanded", "true");
                    menuToggle.setAttribute("aria-label", "Close navigation");

                    const icon = $("i", menuToggle);

                    if (icon) {
                        icon.setAttribute("data-lucide", "x");
                    }

                    refreshIcons(menuToggle);
                }
            });

            $$(".nav-link, .nav-cta", navMenu).forEach(link => {
                link.addEventListener("click", closeMenu);
            });

            document.addEventListener("click", event => {
                if (
                    menuToggle.getAttribute("aria-expanded") === "true" &&
                    !navMenu.contains(event.target) &&
                    !menuToggle.contains(event.target)
                ) {
                    closeMenu();
                }
            });

            window.addEventListener("resize", () => {
                if (window.innerWidth > 900) {
                    closeMenu();
                }
            });
        }

        const navLinks = $$(".nav-link");

        const sections = navLinks
            .map(link => $(link.getAttribute("href")))
            .filter(section => section && section.id);

        function updateActiveNavigation() {
            const marker = window.scrollY + 150;
            let activeId = "home";

            sections.forEach(section => {
                if (section.offsetTop <= marker) {
                    activeId = section.id;
                }
            });

            navLinks.forEach(link => {
                const active = link.getAttribute("href") === `#${activeId}`;

                link.classList.toggle("active", active);

                if (active) {
                    link.setAttribute("aria-current", "location");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        }

        window.addEventListener("scroll", updateActiveNavigation, {
            passive: true
        });

        updateActiveNavigation();

        const propertyGrid = $("#propertyGrid");

        const propertyCards = propertyGrid
            ? $$(".property-card", propertyGrid)
            : [];

        const searchForm = $("#propertySearch");
        const searchLocation = $("#searchLocation");
        const searchType = $("#searchType");
        const searchPurpose = $("#searchPurpose");
        const searchBudget = $("#searchBudget");
        const filterButtons = $$(".filter-btn");
        const propertySort = $("#propertySort");
        const noResults = $("#noResults");
        const resetSearch = $("#resetSearch");
        const viewAllButton = $("#viewAllProperties");
        const propertiesToShow = 3;
        let showingAllProperties = false;

        const loadMoreButton = $("#loadMoreProperties");

        let activePurposeFilter = "all";
        let activeCategoryFilter = "all";
        let lastVisibleCards = propertyCards.slice();

        function cardText(card) {
            return [
                card.dataset.location || "",
                $(".property-location", card)?.textContent || "",
                $("h3", card)?.textContent || "",
                card.dataset.type || "",
                card.dataset.purpose || ""
            ].join(" ").toLowerCase();
        }

        function applyPropertyFilters(options = {}) {
            const locationQuery = (searchLocation?.value || "")
                .trim()
                .toLowerCase();

            const selectedType = searchType?.value || "";
            const selectedPurpose = searchPurpose?.value || "";
            const maxBudget = Number(searchBudget?.value || 0);
            const sortMode = propertySort?.value || "featured";

            let matchingCards = propertyCards.filter(card => {
                const matchesLocation =
                    !locationQuery || cardText(card).includes(locationQuery);

                const matchesType =
                    !selectedType || card.dataset.type === selectedType;

                const matchesPurpose =
                    !selectedPurpose || card.dataset.purpose === selectedPurpose;

                const matchesPurposeTab =
                    activePurposeFilter === "all" ||
                    card.dataset.purpose === activePurposeFilter;

                const matchesCategory =
                    activeCategoryFilter === "all" ||
                    card.dataset.type === activeCategoryFilter;

                const price = Number(card.dataset.price || 0);

                const matchesBudget =
                    !maxBudget || (price > 0 && price <= maxBudget);

                return (
                    matchesLocation &&
                    matchesType &&
                    matchesPurpose &&
                    matchesPurposeTab &&
                    matchesCategory &&
                    matchesBudget
                );
            });

            matchingCards.sort((a, b) => {
                const priceA = Number(a.dataset.price || 0);
                const priceB = Number(b.dataset.price || 0);

                if (sortMode === "low") {
                    return priceA - priceB;
                }

                if (sortMode === "high") {
                    return priceB - priceA;
                }

                const featuredA = Number(a.dataset.featured || 0);
                const featuredB = Number(b.dataset.featured || 0);

                return (
                    featuredB - featuredA ||
                    propertyCards.indexOf(a) - propertyCards.indexOf(b)
                );
            });

            propertyCards.forEach(card => {
                const index = matchingCards.indexOf(card);

                const shouldShow =
                    index !== -1 &&
                    (showingAllProperties || index < propertiesToShow);

                card.hidden = !shouldShow;
                card.style.display = shouldShow ? "" : "none";
            });
            if (propertyGrid) {
                matchingCards.forEach(card => {
                    propertyGrid.appendChild(card);
                });

                propertyCards
                    .filter(card => !matchingCards.includes(card))
                    .forEach(card => {
                        propertyGrid.appendChild(card);
                    });
            }

            lastVisibleCards = matchingCards;

            if (viewAllButton) {
                viewAllButton.style.display =
                    matchingCards.length > propertiesToShow ? "" : "none";

                viewAllButton.textContent = showingAllProperties
                    ? "View Less Properties"
                    : "View All Properties";
            }

            if (noResults) {
                noResults.hidden = matchingCards.length > 0;

                noResults.style.display =
                    matchingCards.length > 0 ? "none" : "block";
            }

            if (loadMoreButton) {
                loadMoreButton.disabled = matchingCards.length === 0;

                loadMoreButton.innerHTML = matchingCards.length
                    ? 'Explore All Properties <i data-lucide="arrow-right"></i>'
                    : "No Properties Available";

                refreshIcons(loadMoreButton);
            }

            if (options.scroll && $("#properties")) {
                $("#properties").scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

            return matchingCards;
        }

        if (searchForm) {
            searchForm.addEventListener("submit", event => {
                event.preventDefault();

                activePurposeFilter = "all";
                activeCategoryFilter = "all";

                filterButtons.forEach(button => {
                    button.classList.toggle(
                        "active",
                        button.dataset.filter === "all"
                    );
                });

                const results = applyPropertyFilters();

                showToast(
                    results.length
                        ? `${results.length} ${results.length === 1 ? "property" : "properties"
                        } found.`
                        : "No matching properties. Try adjusting your filters."
                );

                $("#properties")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });
        }

        [
            searchLocation,
            searchType,
            searchPurpose,
            searchBudget
        ].forEach(control => {
            if (!control) return;

            control.addEventListener(
                control.tagName === "INPUT" ? "input" : "change",
                () => {
                    applyPropertyFilters();
                }
            );
        });

        filterButtons.forEach(button => {
            button.addEventListener("click", () => {
                activePurposeFilter = button.dataset.filter || "all";
                activeCategoryFilter = "all";

                filterButtons.forEach(item => {
                    item.classList.toggle("active", item === button);
                });

                applyPropertyFilters();
            });
        });

        if (propertySort) {
            propertySort.addEventListener("change", () => {
                applyPropertyFilters();
            });
        }

        function chooseCategory(category) {
            activeCategoryFilter = category || "all";
            activePurposeFilter = "all";

            if (searchType) {
                searchType.value = category || "";
            }

            if (searchPurpose) {
                searchPurpose.value = "";
            }

            filterButtons.forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.filter === "all"
                );
            });

            applyPropertyFilters();

            $("#properties")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            showToast(
                `Showing ${category === "all" ? "all properties" : `${category} properties`
                }.`
            );
        }

        $$(".category-card[data-category]").forEach(button => {
            button.addEventListener("click", () => {
                chooseCategory(button.dataset.category);
            });
        });

        $$("[data-footer-category]").forEach(link => {
            link.addEventListener("click", () => {
                chooseCategory(link.dataset.footerCategory);
            });
        });

        function resetAllFilters() {
            if (searchForm) {
                searchForm.reset();
            }

            activePurposeFilter = "all";
            activeCategoryFilter = "all";

            filterButtons.forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.filter === "all"
                );
            });

            if (propertySort) {
                propertySort.value = "featured";
            }

            applyPropertyFilters();

            showToast("Property filters have been reset.");
        }

        if (resetSearch) {
            resetSearch.addEventListener("click", resetAllFilters);
        }


        function updatePropertiesView() {
            const matchingCards = lastVisibleCards;

            matchingCards.forEach((card, index) => {
                const shouldShow = showingAllProperties || index < propertiesToShow;

                card.hidden = !shouldShow;
                card.style.display = shouldShow ? "" : "none";
            });

            if (viewAllButton) {
                viewAllButton.textContent = showingAllProperties
                    ? "View Less Properties"
                    : "View All Properties";

                viewAllButton.setAttribute(
                    "aria-expanded",
                    String(showingAllProperties)
                );
            }

            if (noResults) {
                noResults.hidden = matchingCards.length > 0;
            }
        }

        if (viewAllButton) {
            viewAllButton.addEventListener("click", event => {
                event.preventDefault();

                showingAllProperties = !showingAllProperties;

                updatePropertiesView();

                if (!showingAllProperties) {
                    $("#properties")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            });
        }



        if (loadMoreButton) {
            loadMoreButton.addEventListener("click", () => {
                if (!lastVisibleCards.length) {
                    showToast("No properties match your current filters.");
                    return;
                }

                lastVisibleCards.forEach(card => {
                    card.hidden = false;
                    card.style.display = "";
                });

                showToast(
                    `You're viewing all ${lastVisibleCards.length} matching demo properties.`
                );

                propertyGrid?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });
        }

        let savedFavorites = [];

        try {
            const stored = localStorage.getItem("estateora-favorites");

            savedFavorites = stored ? JSON.parse(stored) : [];

            if (!Array.isArray(savedFavorites)) {
                savedFavorites = [];
            }
        } catch (error) {
            savedFavorites = [];
        }

        function saveFavorites() {
            try {
                localStorage.setItem(
                    "estateora-favorites",
                    JSON.stringify(savedFavorites)
                );
            } catch (error) {
                showToast(
                    "Favorites are available for this visit, but could not be saved."
                );
            }
        }

        function syncFavoriteButtons() {
            $$(".favorite-btn", propertyGrid || document).forEach(button => {
                const card = button.closest(".property-card");

                if (!card) return;

                const isSaved = savedFavorites.includes(card.dataset.id);

                button.classList.toggle("is-favorite", isSaved);
                button.classList.toggle("active", isSaved);

                button.setAttribute("aria-pressed", String(isSaved));

                button.setAttribute(
                    "aria-label",
                    `${isSaved ? "Remove" : "Add"} ${$("h3", card)?.textContent || "property"
                    } ${isSaved ? "from" : "to"} favorites`
                );

                const icon = $("i", button);

                if (icon) {
                    icon.setAttribute("data-lucide", "heart");
                }
            });

            refreshIcons(propertyGrid || document);
        }

        $$(".favorite-btn", propertyGrid || document).forEach(button => {
            button.addEventListener("click", () => {
                const card = button.closest(".property-card");

                if (!card) return;

                const id = card.dataset.id;
                const name = $("h3", card)?.textContent || "Property";

                if (savedFavorites.includes(id)) {
                    savedFavorites = savedFavorites.filter(
                        savedId => savedId !== id
                    );

                    showToast(`${name} removed from favorites.`);
                } else {
                    savedFavorites.push(id);

                    showToast(`${name} added to favorites.`);
                }

                saveFavorites();
                syncFavoriteButtons();
            });
        });

        syncFavoriteButtons();

        const modalOverlay = $("#propertyModal");
        const modalBody = $("#modalBody");
        const closeModalButton = $("#closeModal");
        const minimizeModalButton = $("#minimizeModal");

        let lastFocusedElement = null;
        let modalMinimized = false;

        function closePropertyModal() {
            if (!modalOverlay) return;

            modalOverlay.classList.remove("active", "show", "open");
            modalOverlay.setAttribute("aria-hidden", "true");
            modalOverlay.style.display = "none";

            document.body.classList.remove("modal-open");

            modalMinimized = false;

            if (modalBody) {
                modalBody.hidden = false;
                modalBody.style.display = "";
            }

            if (minimizeModalButton) {
                minimizeModalButton.setAttribute(
                    "aria-label",
                    "Minimize property details"
                );

                minimizeModalButton.innerHTML =
                    '<i data-lucide="minus"></i>';

                refreshIcons(minimizeModalButton);
            }

            if (
                lastFocusedElement &&
                typeof lastFocusedElement.focus === "function"
            ) {
                lastFocusedElement.focus();
            }
        }

        function openPropertyModal(card, trigger) {
            if (!modalOverlay || !modalBody || !card) return;

            lastFocusedElement = trigger || document.activeElement;

            const image = $("img", card);
            const title = $("h3", card)?.textContent || "Property Details";

            const location =
                $(".property-location", card)?.textContent.trim() ||
                "Location not specified";

            const price =
                $(".property-price", card)?.innerHTML ||
                "Contact for price";

            const purpose =
                card.dataset.purpose === "rent" ? "For Rent" : "For Sale";

            const type = (card.dataset.type || "property").replace(
                /^./,
                letter => letter.toUpperCase()
            );

            const features = $$(".property-features span", card).map(
                feature => feature.textContent.trim()
            );

            const imageSrc = image ? image.src : "";
            const imageAlt = image ? image.alt : title;

            modalBody.innerHTML = `
                <div class="modal-property">
                    ${imageSrc
                    ? `<img class="modal-property-image" src="${imageSrc}" alt="${imageAlt.replace(
                        /"/g,
                        "&quot;"
                    )}">`
                    : ""
                }

                    <div class="modal-property-content">
                        <span class="property-badge modal-purpose">${purpose}</span>

                        <p class="property-location">${location}</p>

                        <h2 id="modalTitle">${title}</h2>

                        <p class="property-price">${price}</p>

                        <p class="modal-property-description">
                            Explore this ${type.toLowerCase()} and contact our team
                            for further details, availability, viewing arrangements,
                            and the latest pricing.
                        </p>

                        <div class="property-features">
                            ${features
                    .map(feature => `<span>${feature}</span>`)
                    .join("")}
                        </div>

                        <div class="modal-property-actions">
                            <a class="btn btn-primary" href="#contact" data-modal-contact>
                                Enquire About This Property
                                <i data-lucide="arrow-up-right"></i>
                            </a>

                            <button type="button" class="btn btn-outline-dark" data-modal-favorite>
                                ${savedFavorites.includes(card.dataset.id)
                    ? "Remove Favorite"
                    : "Add to Favorites"
                }
                                <i data-lucide="heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            modalOverlay.classList.add("active", "show", "open");
            modalOverlay.setAttribute("aria-hidden", "false");

            modalOverlay.style.display = "flex";
            modalOverlay.style.visibility = "visible";
            modalOverlay.style.opacity = "1";

            document.body.classList.add("modal-open");

            modalMinimized = false;

            modalBody.hidden = false;
            modalBody.style.display = "";

            if (minimizeModalButton) {
                minimizeModalButton.setAttribute(
                    "aria-label",
                    "Minimize property details"
                );

                minimizeModalButton.innerHTML =
                    '<i data-lucide="minus"></i>';
            }

            refreshIcons(modalOverlay);

            const contactLink = $("[data-modal-contact]", modalBody);

            contactLink?.addEventListener("click", () => {
                closePropertyModal();
            });

            const favoriteAction = $("[data-modal-favorite]", modalBody);

            favoriteAction?.addEventListener("click", () => {
                const id = card.dataset.id;

                if (savedFavorites.includes(id)) {
                    savedFavorites = savedFavorites.filter(
                        savedId => savedId !== id
                    );

                    showToast(`${title} removed from favorites.`);
                } else {
                    savedFavorites.push(id);

                    showToast(`${title} added to favorites.`);
                }

                saveFavorites();
                syncFavoriteButtons();

                favoriteAction.innerHTML = `
                    ${savedFavorites.includes(id)
                        ? "Remove Favorite"
                        : "Add to Favorites"
                    }
                    <i data-lucide="heart"></i>
                `;

                refreshIcons(favoriteAction);
            });

            closeModalButton?.focus();
        }

        $$(".property-details-btn").forEach(button => {
            button.addEventListener("click", () => {
                const card = button.closest(".property-card");

                openPropertyModal(card, button);
            });
        });

        if (closeModalButton) {
            closeModalButton.addEventListener("click", closePropertyModal);
        }

        if (minimizeModalButton) {
            minimizeModalButton.addEventListener("click", () => {
                if (!modalBody || !modalOverlay) return;

                modalMinimized = !modalMinimized;

                modalBody.hidden = modalMinimized;
                modalBody.style.display = modalMinimized ? "none" : "";

                minimizeModalButton.setAttribute(
                    "aria-label",
                    modalMinimized
                        ? "Restore property details"
                        : "Minimize property details"
                );

                minimizeModalButton.innerHTML = `
                    <i data-lucide="${modalMinimized ? "maximize-2" : "minus"
                    }"></i>
                `;

                refreshIcons(minimizeModalButton);
            });
        }

        if (modalOverlay) {
            modalOverlay.addEventListener("click", event => {
                if (event.target === modalOverlay) {
                    closePropertyModal();
                }
            });
        }

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeMenu();

                if (
                    modalOverlay &&
                    modalOverlay.getAttribute("aria-hidden") === "false"
                ) {
                    closePropertyModal();
                }
            }
        });

        const contactForm = $("#contactForm");
        const formStatus = $("#formStatus");

        if (contactForm) {
            const nameInput = $("#contactName", contactForm);
            const emailInput = $("#contactEmail", contactForm);
            const phoneInput = $("#contactPhone", contactForm);

            function showFieldError(input, message) {
                if (!input) return;

                input.setCustomValidity(message);
                input.reportValidity();
            }

            function validateName() {
                if (!nameInput) return true;

                const name = nameInput.value.trim();

                if (name.length < 2) {
                    showFieldError(nameInput, "Please enter your full name (at least 2 characters).");
                    return false;
                }

                if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(name)) {
                    showFieldError(nameInput, "Please enter a valid name using letters only.");
                    return false;
                }

                nameInput.setCustomValidity("");
                return true;
            }

            function validateEmail() {
                if (!emailInput) return true;

                const email = emailInput.value.trim();
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

                if (!emailPattern.test(email)) {
                    showFieldError(emailInput, "Please enter a valid email address, e.g. name@example.com.");
                    return false;
                }

                emailInput.setCustomValidity("");
                return true;
            }

            function validatePhone() {
                if (!phoneInput) return true;

                const phone = phoneInput.value.trim();
                const digits = phone.replace(/\D/g, "");

                if (!/^\+?[0-9\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
                    showFieldError(phoneInput, "Please enter a valid phone number containing 7–15 digits.");
                    return false;
                }

                phoneInput.setCustomValidity("");
                return true;
            }

            if (nameInput) {
                nameInput.addEventListener("input", () => {
                    nameInput.setCustomValidity("");
                });

                nameInput.addEventListener("blur", validateName);
            }

            if (emailInput) {
                emailInput.addEventListener("input", () => {
                    emailInput.setCustomValidity("");
                });

                emailInput.addEventListener("blur", validateEmail);
            }

            if (phoneInput) {
                phoneInput.addEventListener("input", () => {
                    phoneInput.setCustomValidity("");
                });

                phoneInput.addEventListener("blur", validatePhone);
            }

            contactForm.addEventListener("submit", event => {
                event.preventDefault();

                const nameValid = validateName();
                const emailValid = validateEmail();
                const phoneValid = validatePhone();

                if (!nameValid || !emailValid || !phoneValid) {
                    if (formStatus) {
                        formStatus.textContent = "Please correct the highlighted fields and try again.";
                        formStatus.classList.remove("success");
                        formStatus.classList.add("error");
                        formStatus.style.display = "block";
                    }

                    return;
                }

                if (!contactForm.reportValidity()) return;

                const name = nameInput ? nameInput.value.trim() : "there";

                if (formStatus) {
                    formStatus.textContent =
                        `Thank you, ${name}! Your form has been completed successfully.We will contact you soon. Plz wait patiencly.`;

                    formStatus.classList.remove("error");
                    formStatus.classList.add("success");
                    formStatus.style.display = "block";
                    formStatus.setAttribute("role", "status");
                    formStatus.setAttribute("aria-live", "polite");
                }

                contactForm.reset();

                [nameInput, emailInput, phoneInput].forEach(input => {
                    if (input) input.setCustomValidity("");
                });
            });
        }



        const scrollToTopButton = $("#scrollToTop");

        if (scrollToTopButton) {
            scrollToTopButton.type = "button";

            scrollToTopButton.setAttribute(
                "aria-label",
                "Scroll to top"
            );

            if (!scrollToTopButton.querySelector("span")) {
                scrollToTopButton.innerHTML = "<span>↑</span>";
            }

            function updateScrollButton() {
                const shouldShow = window.scrollY > 300;

                scrollToTopButton.style.display =
                    shouldShow ? "flex" : "none";

                scrollToTopButton.style.alignItems = "center";
                scrollToTopButton.style.justifyContent = "center";
                scrollToTopButton.style.visibility = "visible";
                scrollToTopButton.style.opacity = "1";
            }

            scrollToTopButton.addEventListener("click", () => {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            });

            window.addEventListener("scroll", updateScrollButton, {
                passive: true
            });

            updateScrollButton();
        }

        const revealTargets = $$(
            ".property-card, .category-card, .service-card, .agent-card, .testimonial-card, .about-content, .why-item"
        );

        if (
            "IntersectionObserver" in window &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            const revealObserver = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) return;

                        entry.target.classList.add("is-visible");

                        revealObserver.unobserve(entry.target);
                    });
                },
                {
                    threshold: 0.12
                }
            );

            revealTargets.forEach(element => {
                element.classList.add("reveal-on-scroll");
                revealObserver.observe(element);
            });
        } else {
            revealTargets.forEach(element => {
                element.classList.add("is-visible");
            });
        }

        const smoothLinks = $$('a[href^="#"]');

        smoothLinks.forEach(link => {
            link.addEventListener("click", event => {
                const href = link.getAttribute("href");

                if (!href || href === "#") {
                    event.preventDefault();
                    return;
                }

                const target = $(href);

                if (!target) return;

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                if (navMenu?.contains(link)) {
                    closeMenu();
                }

                if (
                    modalOverlay?.contains(link) &&
                    link.matches("[data-modal-contact]")
                ) {
                    closePropertyModal();
                }

                if (history.replaceState) {
                    history.replaceState(null, "", href);
                }
            });
        });
        const homeLinks = $$('a[href="#home"]');

        homeLinks.forEach(link => {
            link.addEventListener("click", event => {
                event.preventDefault();

                const homeSection = $("#home");

                if (!homeSection) return;

                closeMenu();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                history.replaceState(null, "", "#home");
            });
        });
        applyPropertyFilters();
        syncFavoriteButtons();
        refreshIcons();
    });
})();