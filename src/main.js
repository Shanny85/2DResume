import {kboom} from "./util/kaboomCtx.js";
import {dailogueData, scaleFactor} from "./util/constants.js";
import {displayDialogue, setCamScale} from "./util/utils.js";

kboom.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    //this bit will set animation using the sprite from the spritesheet.
    anims: {
        "idle-down": 936,
        "walk-down": {from: 936, to: 939, loop: true, speed:8},
        "idle-side": 975,
        "walk-side": {from: 975, to: 978, loop: true, speed:8},
        "idle-up": 1014,
        "walk-up": {from: 1014, to: 1017, loop: true, speed:8},
    },
});


kboom.loadSprite("map", "./map.png");
kboom.setBackground(kboom.Color.fromHex("#311047"));

//this is for creating scenes.
kboom.scene("main", async () => {
    const mapData = await (await fetch("./map.json")).json();
    const layers = mapData.layers;

    //this is to make the map, use add instead of make to show map now.
    const map = kboom.add([
        kboom.sprite("map"),
        kboom.pos(0),
        kboom.scale(scaleFactor)
    ]);
    //this is required to create the player
    const player = kboom.make([
        kboom.sprite("spritesheet", {anim: "idle-down"}),
        kboom.area({shape: new kboom.Rect(kboom.vec2(0, 3), 10, 10)}),
        kboom.body(),
        kboom.anchor("center"),
        kboom.pos(),
        kboom.scale(scaleFactor),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
        },
        "player",
    ]);
    // logic for the boundaries.
    for (const layer of layers) {
        if (layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                map.add([
                    kboom.area({
                        shape: new kboom.Rect(kboom.vec2(0), boundary.width, boundary.height),
                    }),
                    //makes the player not pass boundaries
                    kboom.body({isStatic: true}),
                    kboom.pos(boundary.x, boundary.y),
                    //identifies the game object that the player collides with
                    boundary.name,
                ]);
                //adding the dialogue
                if (boundary.name) {
                    player.onCollide(boundary.name, () => {
                        player.isInDialogue = true;
                        //dialogue is displayed here,
                        displayDialogue(dailogueData[boundary.name], () => (player.isInDialogue = false))
                    });
                }
            }
            continue;
        }
        if (layer.name === "spawnpoints") {
            for (const entity of layer.objects) {
                if (entity.name === "player") {
                    player.pos =kboom.vec2(
                        (map.pos.x + entity.x) * scaleFactor,
                        (map.pos.y + entity.y) * scaleFactor
                    );
                    kboom.add(player);

                }
            }
        }
    }

    //logic to set cam scale
    setCamScale(kboom)

    kboom.onResize(() => {
        setCamScale(kboom)
    })

    //logic to make the camera follow the player
    kboom.onUpdate(() => {
        kboom.camPos(player.pos.x, player.pos.y + 100)
    })

    //logic to move the player,
    kboom.onMouseDown((mouseBtn) => {
        if (mouseBtn !== "left" || player.isInDialogue) return;
        const worldMousePos = kboom.toWorld(kboom.mousePos());
        player.moveTo(worldMousePos, player.speed);

        //getting the angles to set the digg views of player
        const mouseAngle = player.pos.angle(worldMousePos)

        const lowerBound = 50;
        const upperBound = 125;

        //conditions for up
        if (mouseAngle > lowerBound &&
            mouseAngle < upperBound &&
            player.curAnim() !== "walk-up"
        ) {
            player.play("walk-up");
            player.direction = "up";
            return;
        }

        //conditions for down
        if (mouseAngle < -lowerBound &&
            mouseAngle > -upperBound &&
            player.curAnim() !== "walk-down"
        ) {
            player.play("walk-down");
            player.direction = "down";
            return;
        }
        //conditions for right
        if (Math.abs(mouseAngle) > upperBound) {
            player.flipX = false;
            if (player.curAnim() !== "walk-side") player.play("walk-side");
            player.direction = "right";
            return;
        }
        //conditions for left
        if (Math.abs(mouseAngle) < lowerBound) {
            player.flipX = true;
            if (player.curAnim() !== "walk-side") player.play("walk-side");
            player.direction = "left";

        }

    });

    //logic to stop player
    kboom.onMouseRelease(() => {
        if (player.direction === "down") {
            player.play("idle-down");
            return;
        }

        if (player.direction === "up") {
            player.play("idle-up");
            return;
        }
        player.play("idle-side");
    })


});

//starts the main loading process.
kboom.go("main");