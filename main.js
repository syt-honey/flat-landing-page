import { comments, comments_en } from "./utils/comment.js"
import { 
    isChinese,
    getCurrentLanguage,
    generateModalItem,
    addModal
} from "./utils/index.js"

void (function () {
    const $ = sel => document.querySelector(sel)
    const $$ = sel => Array.from(document.querySelectorAll(sel))
    Node.prototype.on = Node.prototype.addEventListener

    function initComment() {
        const { speed, currentComment, desktopContainerCls, mobileContainerCls } = $CONFIG.comment
        const commentDesktopContainers = $$(desktopContainerCls)
        const commentMobileContainer = $(mobileContainerCls)
        const span = Math.ceil(currentComment.length / commentDesktopContainers.length)

        const fragment = currentComment.map(i => {
            const comment = document.createElement("div")
            comment.innerHTML = `
                <span>${i.name}</span>
                <p class="subtitle">${i.content}</p>
            `
            return comment
        })

        commentDesktopContainers.forEach((container, idx) =>
            container.append(
                ...fragment.slice(idx * span, span * (idx + 1)).map(i => i.cloneNode(true)),
                // the purpose of this copy is to make the animation keyframe to set `translateY(-50%)` at `to`。
                ...fragment.slice(idx * span, span * (idx + 1)).map(i => i.cloneNode(true)),
            ),
        )
        commentMobileContainer.append(
            ...fragment.map(i => i.cloneNode(true)),
            ...fragment.map(i => i.cloneNode(true)),
        )

        // make the same speed for each comment list
        document.on("DOMContentLoaded", function () {
            commentDesktopContainers.forEach(container => {
                const animation = initAnimationSpeed(container)
                container.classList.add(animation)
            })
        })

        function initAnimationSpeed(el, s = speed) {
            const { offsetHeight } = el
            const uid = Math.random().toString(36).substring(2)
            const style = document.createElement("style")

            style.innerHTML = `
                @keyframes scroll${uid} {
                    from {
                        transform: translateY(0)
                    }
                    to {
                        transform: translateY(-50%)
                    }
                }
                .scroll-${uid}{
                    animation: ${Math.floor(
                        ((offsetHeight / 2) * 1000) / s,
                    )}ms scroll${uid} linear infinite normal
                }`

            document.getElementsByTagName("head")[0].appendChild(style)
            return `scroll-${uid}`
        }
    }

    function initTabSwitch() {
        const { interval } = $CONFIG.tab
        const timer = []
        for (let i = 0; i < 3; i++) {
            const tabs = $$(`.carousel-${i + 1} .items .item`).filter(
                i => !i.classList.contains("text-disabled"),
            )
            const imgs = $$(`.carousel-${i + 1} .images img`)

            function updateTab(activeTab) {
                tabs.forEach((tab, i) => {
                    const visible = tab.classList.toggle("active", tab === activeTab)
                    imgs[i].style.display = visible ? "inline-block" : "none"
                })
            }
            tabs.forEach(tab => tab.on("click", updateTab.bind(null, tab)))

            timer.push(
                setInterval(() => {
                    const activeTab = tabs.find(tab => tab.classList.contains("active"))
                    const index = tabs.indexOf(activeTab)
                    const nextIndex = (index + 1) % tabs.length
                    updateTab(tabs[nextIndex])
                }, interval),
            )
        }

        window.addEventListener(
            "beforeunload",
            timer.forEach(t => clearInterval.bind(null, t)),
        )
    }

    function setLanguageSwitch() {
        const { 
            modalId,
            options,
            langKey,
            langHref,
            desktopTargetId,
            mobileTargetId,
            bodyCls,
            queryBodyCls 
        } = $CONFIG.lang

        const selectLangCallback = lang => {
            localStorage.setItem(langKey, lang)
            window.location.href = langHref[lang]
        }

        // desktop
        const select = $(desktopTargetId)
        select.innerHTML = ""

        const langGroup = options.map(({ key, name }) => {
            const option = document.createElement("option")
            option.value = key
            option.textContent = name
            return option
        })
        select.append(...langGroup)
        select.value = getCurrentLanguage()

        select.on("change", e => selectLangCallback(e.target.value))

        // mobile
        $(mobileTargetId).on("click", e => {
            langCallbackMobile()
            e.stopPropagation()
        })

        function langCallbackMobile() {
            if (!$(modalId)) {
                addModal({ id: modalId.substring(1), bodyCls })

                const langModalBody = $(queryBodyCls)
                langModalBody.innerHTML = ""
                const langGroup = options.map(({ key, name }) => {
                    const p = generateModalItem({ value: name }, e =>
                        selectLangCallback(e.target.value),
                    )
                    p.value = key
                    p.classList.toggle("active", key === getCurrentLanguage())
                    return p
                })
                langModalBody.append(...langGroup)
            } else {
                document.body.removeChild($(modalId))
            }
        }
    }

    function initFolding() {
        const { id, options, target, bodyCls, queryBodyCls } = $CONFIG.folding

        $(target).on("click", e => {
            foldingCallback()
            e.stopPropagation()
        })

        function foldingCallback() {
            if (!$(id)) {
                addModal({ id: id.substring(1), bodyCls })

                const foldingModalBody = $(queryBodyCls)
                foldingModalBody.innerHTML = ""
                foldingModalBody.append(
                    ...Object.keys(options).map(key =>
                        generateModalItem({ value: options[key].value }, options[key].callback),
                    ),
                )
            } else {
                document.body.removeChild($(id))
            }
        }
    }

    function setCoverAnimation() {
        const { cls, maxRotation } = $CONFIG.cover
        let guard = false
        const cover = $(cls)

        cover.on("mousemove", e => {
            guard = true
            requestAnimationFrame(() => {
                if (!guard) {
                    return
                }

                const { offsetWidth, offsetHeight } = cover
                const { left, top } = cover.getBoundingClientRect()
                const { clientX: mouseX, clientY: mouseY } = e

                const centerX = left + offsetWidth / 2
                const centerY = top + offsetHeight / 2

                const rotateX = maxRotation * ((centerX - mouseX) / (offsetWidth / 2))
                const rotateY = -maxRotation * ((centerY - mouseY) / (offsetHeight / 2))

                // Actually, the animation is not matched with design. 
                // The design describes gravity dynamics, where all four corners are pressed down, which is not the case here. 
                // @TODO: This needs to be optimized if there is time
                // if ((rotateX > 0 && rotateY < 0 || rotateX < 0 && rotateY > 0) && Math.abs(rotateX) > 0.1 && Math.abs(rotateY) > 0.1) {
                //     rotateX = -rotateX
                //     rotateY = -rotateY
                // }

                cover.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
                cover.style.transition = "transform .1s ease-in-out"
            })
        })

        cover.on("mouseleave", () => {
            guard = false
            cover.style.transform = "none"
            cover.style.transition = "transform .7s ease-in-out"
        })
    }

    function initMacDownloadModal() {
        const { macId, closeCls, modalId } = $CONFIG.download
        const macDownloadBtn = $(macId)
        const closeBtn = $(closeCls)
        const modal = $(modalId)

        macDownloadBtn.on("click", () => modal.classList.add("active"))
        closeBtn.on("click", () => modal.classList.remove("active"))
    }

    function main() {
        const CONFIG = {
            folding: {
                id: "#folding-modal",
                target: "#folding-mobile",
                bodyCls: "folding",
                queryBodyCls: ".modal-wrap-mobile.folding",
                options: {
                    feedback: {
                        value: isChinese() ? "问题反馈" : "Feedback",
                        callback: () =>
                            window.open("https://github.com/netless-io/flat/issues", "_blank"),
                    }
                }
            },
            lang: {
                desktopTargetId: "#lang",
                mobileTargetId: "#lang-mobile",
                langKey: "flat:language",
                langHref: {
                    "zh-CN": "/",
                    "en": "/en/",
                },
                options: [
                    { key: "zh-CN", name: "简体中文" },
                    { key: "en", name: "English" },
                ],
                modalId: "#lang-modal",
                bodyCls: "lang",
                queryBodyCls: ".modal-wrap-mobile.lang",
            },
            tab: {
                interval: 3000,
            },
            download: {
                macId: "#mac-download",
                closeCls: ".modal-close-btn",
                modalId: "#download-modal",
            },
            cover: {
                cls: ".cover",
                maxRotation: 1 // adjust this value to change the rotation effect
            },
            comment: {
                speed: 35,
                currentComment: isChinese() ? comments : comments_en,
                desktopContainerCls: ".scroll .desktop",
                mobileContainerCls: ".scroll .mobile",
            }
        }
        window.$CONFIG = CONFIG

        initComment() // set comments
        initTabSwitch() // set carousel item event
        initMacDownloadModal() // set mac download modal
        initFolding() // set folding
        setLanguageSwitch() // set language
        setCoverAnimation() // set header cover press effect

        // set header shadow on scroll
        window.addEventListener("scroll", () =>
            $("header").classList.toggle("with-shadow", window.scrollY > 0),
        )
    }

    document.addEventListener("DOMContentLoaded", main)
})()
