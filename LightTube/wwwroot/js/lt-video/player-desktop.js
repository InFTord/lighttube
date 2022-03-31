﻿class Player {
    constructor(query, info, sources, shakaVideo) {
        // vars
        this.muted = false;
        this.info = info;
        this.sources = sources;
        this.__videoElement = document.querySelector(query);
        this.__videoElement.removeAttribute("controls");
        this.__shaka = shakaVideo;

        // container
        const container = document.createElement("div");
        container.classList.add("player");
        this.__videoElement.parentElement.appendChild(container);
        container.appendChild(this.__videoElement);
        this.container = container;
        if (info.embed) {
            this.container.classList.add("embed");
            this.__videoElement.classList.remove("embed");
        }

        // default source
        if (shakaVideo === undefined) {
            for (let source of sources) {
                if (source.height <= 720) {
                    console.log("source set to " + source.label)
                    this.__videoElement.src = source.src;
                    break;
                }
            }
        } else {
            //todo: fix for shaka
        }

        // controls
        const createButton = (tag, icon) => {
            const b = document.createElement(tag);
            b.classList.add("player-button");
            if (icon !== "")
                b.innerHTML = `<i class="bi bi-${icon}"></i>`;
            return b;
        }

        this.controls = {
            play: createButton("div", "play-fill"),
            pause: createButton("div", "pause-fill"),
            volume: createButton("div", "volume-up-fill"),
            time: document.createElement("span"),
            div: document.createElement("div"),
            settings: createButton("div", "gear-fill"),
            embed: createButton("a", ""),
            pip: createButton("div", "pip"),
            fullscreen: createButton("div", "fullscreen")
        }

        const controlHolder = document.createElement("div");
        controlHolder.classList.add("player-controls");

        this.controls.embed.innerHTML = "<span style='text-align: center; width: 100%'>l<b>t</b></span>";
        this.controls.embed.setAttribute("target", "_blank");
        this.controls.embed.setAttribute("href", "/watch?v=" + info.id);
        if (!info.embed) this.controls.embed.style.display = "none";

        const els = [
            document.createElement("div"),
            document.createElement("div"),
        ]
        for (const padding of els)
            padding.classList.add("player-controls-padding");

        controlHolder.appendChild(els[0]);
        for (const control of Object.values(this.controls)) {
            controlHolder.appendChild(control);
        }
        controlHolder.appendChild(els[1]);
        container.appendChild(controlHolder);

        this.controls.play.onclick = () => this.togglePlayPause();
        this.controls.pause.onclick = () => this.togglePlayPause();
        this.controls.volume.onclick = e => this.mute(e);
        this.controls.volume.classList.add("player-volume");
        this.controls.fullscreen.onclick = () => this.fullscreen();

        if (document.pictureInPictureEnabled === true)
            this.controls.pip.onclick = () => this.pip();
        else
            this.controls.pip.style.display = "none";

        let volumeRange = document.createElement("input");
        volumeRange.oninput = e => this.setVolume(e);
        volumeRange.setAttribute("min", "0");
        volumeRange.setAttribute("max", "1");
        volumeRange.setAttribute("step", "0.01");
        volumeRange.setAttribute("value", "1");
        volumeRange.setAttribute("type", "range");
        this.controls.volume.appendChild(volumeRange);

        this.controls.div.classList.add("player-button-divider")

        // playback bar
        if (!info.live) {
            this.playbackBar = {
                bg: document.createElement("div"),
                played: document.createElement("div"),
                buffered: document.createElement("div"),
                hover: document.createElement("div"),
                sb: document.createElement("div"),
                sbC: document.createElement("div"),
                hoverText: document.createElement("span")
            }
            this.playbackBar.bg.classList.add("player-playback-bar");
            this.playbackBar.bg.classList.add("player-playback-bar-bg");
            this.playbackBar.played.classList.add("player-playback-bar");
            this.playbackBar.played.classList.add("player-playback-bar-fg");
            this.playbackBar.buffered.classList.add("player-playback-bar");
            this.playbackBar.buffered.classList.add("player-playback-bar-buffer");
            this.playbackBar.bg.appendChild(this.playbackBar.buffered);
            this.playbackBar.bg.appendChild(this.playbackBar.played);

            this.playbackBar.hover.classList.add("player-playback-bar-hover");
            this.playbackBar.sb.classList.add("player-storyboard-image");
            this.playbackBar.sbC.classList.add("player-storyboard-image-container");
            this.playbackBar.sb.style.backgroundImage = `url("${info.storyboard}")`;

            let playbackBarContainer = document.createElement("div");
            playbackBarContainer.classList.add("player-playback-bar-container")
            this.playbackBar.bg.onclick = e => {
                this.playbackBarSeek(e)
            }
            this.playbackBar.bg.ondragover = e => {
                this.playbackBarSeek(e)
            }
            this.playbackBar.bg.onmouseenter = () => {
                this.playbackBar.hover.style.display = "block";
            }
            this.playbackBar.bg.onmouseleave = () => {
                this.playbackBar.hover.style.display = "none";
            }
            this.playbackBar.bg.onmousemove = e => {
                this.moveHover(e)
            }
            playbackBarContainer.appendChild(this.playbackBar.bg);
            this.playbackBar.sbC.appendChild(this.playbackBar.sb)
            this.playbackBar.hover.appendChild(this.playbackBar.sbC)
            this.playbackBar.hover.appendChild(this.playbackBar.hoverText)
            playbackBarContainer.appendChild(this.playbackBar.hover);
            container.appendChild(playbackBarContainer);
        }

        // title
        this.titleElement = document.createElement("div");
        this.titleElement.classList.add("player-title");
        this.titleElement.innerText = info.title;
        container.appendChild(this.titleElement);
        if (!info.embed)
            this.titleElement.style.display = "none";

        // update the time text
        if (!info.live) {
            this.__videoElement.ontimeupdate = e => this.timeUpdate(e);
            this.__videoElement.ondurationchange = e => this.timeUpdate(e);
        }

        // events
        container.onfullscreenchange = () => {
            if (!document.fullscreenElement) {
                this.controls.fullscreen.querySelector("i").setAttribute("class", "bi bi-fullscreen");
                if (!info.embed)
                    this.titleElement.style.display = "none";
            } else {
                this.titleElement.style.display = "block";
                this.controls.fullscreen.querySelector("i").setAttribute("class", "bi bi-fullscreen-exit");
            }
        }
        const updatePlayButtons = () => {
            if (this.__videoElement.paused) {
                this.controls.pause.style.display = "none";
                this.controls.play.style.display = "block";
            } else {
                this.controls.pause.style.display = "block";
                this.controls.play.style.display = "none";
            }
        }
        this.__videoElement.onplay = () => updatePlayButtons();
        this.__videoElement.onpause = () => updatePlayButtons();
        updatePlayButtons();
        this.__videoElement.onclick = () => this.togglePlayPause();
        this.__videoElement.ondblclick = () => this.fullscreen();

        this.container.onmouseenter = () => {
            this.controlsDisappearTimeout = Number.MAX_SAFE_INTEGER;
        }
        this.container.onmouseleave = () => {
            let d = new Date();
            d.setSeconds(d.getSeconds() + 3);
            this.controlsDisappearTimeout = d.getTime();
        }
        
        if (shakaVideo !== undefined) {
            shakaVideo.addEventListener("variantchanged", () => {
                this.updateMenu();
            })
        }

        // menu
        this.controls.settings.onclick = e => this.menuButtonClick(e);
        this.controls.settings.setAttribute("data-action", "toggle");
        this.controls.settings.querySelector("i").setAttribute("data-action", "toggle");
        this.updateMenu(sources);
    }
}

Player.prototype.togglePlayPause = function () {
    if (this.__videoElement.paused)
        this.__videoElement.play();
    else
        this.__videoElement.pause();
};

Player.prototype.updateMenu = function () {
    const makeButton = (label, action, icon) => {
        const b = document.createElement("div");
        //todo: yes fix this
        b.innerHTML = `<i class="bi bi-${icon}"></i>${label}`;
        b.onclick = e => this.menuButtonClick(e);
        b.setAttribute("data-action", action)
        b.classList.add("player-menu-item")
        return b;
    }

    const makeMenu = function (id, buttons) {
        const menu = document.createElement("div");
        menu.id = id;
        for (const button of buttons) {
            menu.appendChild(makeButton(button.label, button.action, button.icon));
        }
        return menu;
    }

    if (this.menuElement) {
        this.menuElement.remove();
        this.menuElement = undefined;
    }
    this.menuElement = document.createElement("div");
    this.menuElement.classList.add("player-menu");
    this.menuElement.appendChild(makeMenu("menu-main", [
        {
            icon: "sliders",
            label: "Quality",
            action: "menu res"
        },
        {
            icon: "badge-cc",
            label: "Subtitles",
            action: "menu sub"
        },
        {
            icon: "speedometer2",
            label: "Speed",
            action: "menu speed"
        }
    ]))
    const resButtons = [
        {
            icon: "arrow-left",
            label: "Back",
            action: "menu main"
        }
    ]

    if (this.__shaka === undefined) {
        for (const index in this.sources) {
            resButtons.push({
                icon: this.sources[index].src === this.__videoElement.src ? "check2" : "",
                label: this.sources[index].label,
                action: "videosrc " + index
            });
        }
    } else {
        resButtons.pop();
        let tracks = this.__shaka.getVariantTracks();
        for (const index in tracks) {
            if (tracks[index].audioId === 2)
                resButtons.unshift({
                    icon: tracks[index].active ? "check2" : "",
                    label: tracks[index].height,
                    action: "shakavariant " + index
                });
        }
        resButtons.unshift(
            {
                icon: "arrow-left",
                label: "Back",
                action: "menu main"
            });
    }
    this.menuElement.appendChild(makeMenu("menu-res", resButtons));
    const subButtons = [
        {
            icon: "arrow-left",
            label: "Back",
            action: "menu main"
        }
    ]

    for (let index = 0; index < this.__videoElement.textTracks.length; index++) {
        if (this.__videoElement.textTracks[index].label.includes("Shaka Player")) continue;
        subButtons.push({
            icon: this.__videoElement.textTracks[index].mode === "showing" ? "check2" : "",
            label: this.__videoElement.textTracks[index].label,
            action: "texttrack " + index
        });
    }
    this.menuElement.appendChild(makeMenu("menu-sub", subButtons));
    this.menuElement.appendChild(makeMenu("menu-speed", [
        {
            icon: "arrow-left",
            label: "Back",
            action: "menu main"
        },
        {
            icon: this.__videoElement.playbackRate === 0.25 ? "check2" : "",
            label: "0.25",
            action: "speed 0.25"
        },
        {
            icon: this.__videoElement.playbackRate === 0.50 ? "check2" : "",
            label: "0.50",
            action: "speed 0.5"
        },
        {
            icon: this.__videoElement.playbackRate === 0.75 ? "check2" : "",
            label: "0.75",
            action: "speed 0.75"
        },
        {
            icon: this.__videoElement.playbackRate === 1 ? "check2" : "",
            label: "Normal",
            action: "speed 1"
        },
        {
            icon: this.__videoElement.playbackRate === 1.25 ? "check2" : "",
            label: "1.25",
            action: "speed 1.25"
        },
        {
            icon: this.__videoElement.playbackRate === 1.50 ? "check2" : "",
            label: "1.50",
            action: "speed 1.5"
        },
        {
            icon: this.__videoElement.playbackRate === 1.75 ? "check2" : "",
            label: "1.75",
            action: "speed 1.75"
        },
        {
            icon: this.__videoElement.playbackRate === 2 ? "check2" : "",
            label: "2",
            action: "speed 2"
        },
    ]))

    this.container.appendChild(this.menuElement);
    for (const child of this.menuElement.children) {
        if (child.tagName === "DIV")
            child.style.display = "none";
    }
}

Player.prototype.openMenu = function (id) {
    for (const child of this.menuElement.children) {
        if (child.tagName === "DIV")
            child.style.display = "none";
    }
    try {
        this.menuElement.querySelector("#menu-" + id).style.display = "block";
    } catch {
        // intended
    }
}

Player.prototype.menuButtonClick = function (e) {
    let args = (e.target.getAttribute("data-action") ?? e.target.parentElement.getAttribute("data-action")).split(" ");
    let command = args.shift();
    let closeMenu = true;
    switch (command) {
        case "toggle":
            closeMenu = this.menuElement.clientHeight !== 0;
            if (!closeMenu)
                this.openMenu("main");
            break;
        case "menu":
            this.openMenu(args[0]);
            closeMenu = false;
            break;
        case "speed":
            this.__videoElement.playbackRate = Number.parseFloat(args[0]);
            this.updateMenu();
            break;
        case "texttrack":
            let i = Number.parseFloat(args[0]);
            for (let index = 0; index < this.__videoElement.textTracks.length; index++) {
                this.__videoElement.textTracks[index].mode = "hidden";

            }
            this.__videoElement.textTracks[i].mode = "showing";
            this.updateMenu();
            break;
        case "videosrc":
            let time = this.__videoElement.currentTime;
            let shouldPlay = !this.__videoElement.paused;
            this.__videoElement.src = this.sources[Number.parseFloat(args[0])].src;
            this.__videoElement.currentTime = time;
            if (shouldPlay)
                this.__videoElement.play();
            this.updateMenu();
            break;
        case "shakavariant":
            this.__shaka.selectVariantTrack(this.__shaka.getVariantTracks()[Number.parseFloat(args[0])], true)
            break;
    }
    if (closeMenu)
        this.openMenu();
};

Player.prototype.mute = function (e) {
    if (e.target.tagName === "INPUT") return;
    this.muted = !this.muted;
    if (this.muted) {
        this.controls.volume.querySelector("i").setAttribute("class", "bi bi-volume-mute-fill");
        this.__videoElement.volume = 0;
    } else {
        this.controls.volume.querySelector("i").setAttribute("class", "bi bi-volume-up-fill");
        this.__videoElement.volume = this.controls.volume.querySelector("input").value;
    }
}

Player.prototype.fullscreen = function () {
    if (!document.fullscreenElement) {
        this.container.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

Player.prototype.pip = function () {
    this.__videoElement.requestPictureInPicture();
}

Player.prototype.timeUpdate = function (e) {
    this.controls.time.innerHTML = this.getTimeString(e.target.currentTime) + " / " + this.getTimeString(e.target.duration);
    this.playbackBar.played.style.width = ((e.target.currentTime / e.target.duration) * 100) + "%";
    this.playbackBar.buffered.style.width = ((this.getLoadEnd() / e.target.duration) * 100) + "%";

    if (this.controlsDisappearTimeout - Date.now() < 0 && !this.container.classList.contains("hide-controls") && !this.__videoElement.paused)
        this.container.classList.add("hide-controls");


    if (this.controlsDisappearTimeout - Date.now() > 0 && this.container.classList.contains("hide-controls"))
        this.container.classList.remove("hide-controls");

    if (this.__videoElement.paused && this.container.classList.contains("hide-controls"))
        this.container.classList.add("hide-controls");
}

Player.prototype.setVolume = function (e) {
    this.__videoElement.volume = e.target.value;
}

Player.prototype.getLoadEnd = function () {
    let longest = -1;
    for (let i = 0; i < this.__videoElement.buffered.length; i++) {
        const end = this.__videoElement.buffered.end(i);
        if (end > longest) longest = end;
    }
    return longest;
}

Player.prototype.playbackBarSeek = function (e) {
    let percentage = (e.offsetX / (this.playbackBar.bg.offsetLeft + this.playbackBar.bg.offsetWidth - 24));
    this.playbackBar.played.style.width = (percentage * 100) + "%";
    this.__videoElement.currentTime = this.__videoElement.duration * percentage;
}

Player.prototype.moveHover = function (e) {
    let percentage = Math.round((e.offsetX / (this.playbackBar.bg.offsetLeft + this.playbackBar.bg.offsetWidth)) * 100);
    let pString = percentage.toString().split("");

    // todo: please get a better way for this
    this.playbackBar.sb.style.backgroundPositionX = `-${Number.parseInt(pString.pop()) * 48}px`;
    this.playbackBar.sb.style.backgroundPositionY = `-${pString.join("") * 27}px`;

    this.playbackBar.hover.style.top = (this.playbackBar.bg.getBoundingClientRect().y - 4 - this.playbackBar.hover.offsetHeight) + 'px';
    this.playbackBar.hover.style.left = (e.clientX - this.playbackBar.hover.offsetWidth / 2) + 'px';
    this.playbackBar.hoverText.innerText = this.getTimeString(this.__videoElement.duration * (percentage / 100));
}

Player.prototype.getTimeString = function (s) {
    let res = s < 3600 ? new Date(s * 1000).toISOString().substr(14, 5) : new Date(s * 1000).toISOString().substr(11, 8);
    if (res.startsWith("0"))
        res = res.substr(1);
    return res;
}

const loadPlayerWithShaka = async (query, info, sources, manifestUri) => {
    let player;
    if (manifestUri !== undefined) {
        shaka.polyfill.installAll();
        let shakaUsable = shaka.Player.isBrowserSupported();
    
        if (shakaUsable) {
            const video = document.querySelector(query);
            player = new shaka.Player(video);
            window.shaka=player;

            player.addEventListener('error', console.log);
    
            try {
                await player.load(manifestUri);
            } catch (e) {
                // todo: fallback to mp4 urls
                console.log(e);
            }
        }
    }

    return new Player(query, info, sources, await player);
}