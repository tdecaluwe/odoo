odoo.define("website.tour_utils", function (require) {
"use strict";

const core = require("web.core");
const _t = core._t;

var tour = require("web_tour.tour");

function addMedia(position = "right") {
    return {
        trigger: `.modal-content footer .btn-primary`,
        content: _t("<b>Add</b> the selected image."),
        position: position,
        run: "click",
    };
}

function changeBackground(snippet, position = "bottom") {
    return {
        trigger: ".o_we_customize_panel .o_we_bg_success",
        content: _t("<b>Customize</b> any block through this menu. Try to change the background image of this block."),
        position: position,
        run: "click",
    };
}

function changeBackgroundColor(position = "bottom") {
    return {
        trigger: ".o_we_customize_panel .o_we_color_preview",
        content: _t("<b>Customize</b> any block through this menu. Try to change the background color of this block."),
        position: position,
        run: "click",
    };
}

function selectColorPalette(position = "left") {
    return {
        trigger: ".o_we_customize_panel .o_we_so_color_palette we-selection-items",
        alt_trigger: ".o_we_customize_panel .o_we_color_preview",
        content: _t(`<b>Select</b> a Color Palette.`),
        position: position,
        run: 'click',
        location: position === 'left' ? '#oe_snippets' : undefined,
    };
}

function changeColumnSize(position = "right") {
    return {
        trigger: `.oe_overlay.ui-draggable.o_we_overlay_sticky.oe_active .o_handle.e`,
        content: _t("<b>Slide</b> this button to change the column size."),
        position: position,
    };
}

function changeIcon(snippet, index = 0, position = "bottom") {
    return {
        trigger: `#wrapwrap .${snippet.id} i:eq(${index})`,
        content: _t("<b>Double click on an icon</b> to change it with one of your choice."),
        position: position,
        run: "dblclick",
    };
}

function changeImage(snippet, position = "bottom") {
    return {
        trigger: snippet.id ? `#wrapwrap .${snippet.id} img` : snippet,
        content: _t("<b>Double click on an image</b> to change it with one of your choice."),
        position: position,
        run: "dblclick",
    };
}

/**
    wTourUtils.changeOption('HeaderTemplate', '[data-name="header_alignment_opt"]', _t('alignment')),
*/
function changeOption(optionName, weName = '', optionTooltipLabel = '', position = "bottom") {
    const option_block = `we-customizeblock-option[class='snippet-option-${optionName}']`
    return {
        trigger: `${option_block} ${weName}, ${option_block} [title='${weName}']`,
        content: _.str.sprintf(_t("<b>Click</b> on this option to change the %s of the block."), optionTooltipLabel),
        position: position,
        run: "click",
    };
}

function selectNested(trigger, optionName, alt_trigger = null, optionTooltipLabel = '', position = "top") {
    const option_block = `we-customizeblock-option[class='snippet-option-${optionName}']`;
    return {
        trigger: trigger,
        content: _.str.sprintf(_t("<b>Select</b> a %s."), optionTooltipLabel),
        alt_trigger: alt_trigger == null ? undefined : `${option_block} ${alt_trigger}`,
        position: position,
        run: 'click',
        location: position === 'left' ? '#oe_snippets' : undefined,
    };
}

function changePaddingSize(direction) {
    let paddingDirection = "n";
    let position = "top";
    if (direction === "bottom") {
        paddingDirection = "s";
        position = "bottom";
    }
    return {
        trigger: `.oe_overlay.ui-draggable.o_we_overlay_sticky.oe_active .o_handle.${paddingDirection}`,
        content: _.str.sprintf(_t("<b>Slide</b> this button to change the %s padding"), direction),
        position: position,
    };
}

/**
 * Click on the top right edit button
 * @param {*} position Where the purple arrow will show up
 */
function clickOnEdit(position = "bottom") {
    return {
        trigger: "a[data-action=edit]",
        content: _t("<b>Click Edit</b> to start designing your homepage."),
        extra_trigger: ".homepage",
        position: position,
    };
}

/**
 * Simple click on a snippet in the edition area
 * @param {*} snippet
 * @param {*} position
 */
function clickOnSnippet(snippet, position = "bottom") {
    return {
        trigger: snippet.id ? `#wrapwrap .${snippet.id}` : snippet,
        content: _t("<b>Click on a snippet</b> to access its options menu."),
        position: position,
        run: "click",
    };
}

function clickOnSave(position = "bottom") {
    return [{
        trigger: "button[data-action=save]",
        in_modal: false,
        content: _t("Good job! It's time to <b>Save</b> your work."),
        position: position,
    }, {
        trigger: 'body:not(.editor_enable)',
        auto: true, // Just making sure save is finished in automatic tests
        run: () => null,
    }];
}

/**
 * Click on a snippet's text to modify its content
 * @param {*} snippet
 * @param {*} element Target the element which should be rewrite
 * @param {*} position
 */
function clickOnText(snippet, element, position = "bottom") {
    return {
        trigger: snippet.id ? `#wrapwrap .${snippet.id} ${element}` : snippet,
        content: _t("<b>Click on a text</b> to start editing it."),
        position: position,
        run: "text",
        consumeEvent: "input",
    };
}

/**
 * Drag a snippet from the Blocks area and drop it in the Edit area
 * @param {*} snippet contain the id and the name of the targeted snippet
 * @param {*} position Where the purple arrow will show up
 */
function dragNDrop(snippet, position = "bottom") {
    return {
        trigger: `#oe_snippets .oe_snippet[name="${snippet.name}"] .oe_snippet_thumbnail:not(.o_we_already_dragging)`,
        extra_trigger: "body.editor_enable.editor_has_snippets",
        moveTrigger: '.oe_drop_zone',
        content: _.str.sprintf(_t("Drag the <b>%s</b> building block and drop it at the bottom of the page."), snippet.name),
        position: position,
        // Normally no main snippet can be dropped in the default footer but
        // targeting it allows to force "dropping at the end of the page".
        run: "drag_and_drop #wrapwrap > footer",
    };
}

function goBackToBlocks(position = "bottom") {
    return {
        trigger: '.o_we_add_snippet_btn',
        content: _t("Click here to go back to block tab."),
        position: position,
        run: "click",
    };
}

function goToTheme(position = "bottom") {
    return {
        trigger: '.o_we_customize_theme_btn',
        content: _t("Go to the Theme tab"),
        position: position,
        run: "click",
    };
}

function selectHeader(position = "bottom") {
    return {
        trigger: `header#top`,
        content: _t(`<b>Click</b> on this header to configure it.`),
        position: position,
        run: "click",
    };
}

function selectSnippetColumn(snippet, index = 0, position = "bottom") {
     return {
        trigger: `#wrapwrap .${snippet.id} .row div[class*="col-lg-"]:eq(${index})`,
        content: _t("<b>Click</b> on this column to access its options."),
         position: position,
        run: "click",
     };
}

function prepend_trigger(steps, prepend_text='') {
    for (const step of steps) {
        if (!step.noPrepend && prepend_text) {
            step.trigger = prepend_text + step.trigger;
        }
    }
    return steps;
}

function registerThemeHomepageTour(name, steps) {
    tour.register(name, {
        url: "/?enable_editor=1",
        sequence: 1010,
        saveAs: "homepage",
    }, prepend_trigger(
        steps.concat(clickOnSave()),
        "html[data-view-xmlid='website.homepage'] "
    ));
}


return {
    addMedia,
    changeBackground,
    changeBackgroundColor,
    changeColumnSize,
    changeIcon,
    changeImage,
    changeOption,
    changePaddingSize,
    clickOnEdit,
    clickOnSave,
    clickOnSnippet,
    clickOnText,
    dragNDrop,
    goBackToBlocks,
    goToTheme,
    selectColorPalette,
    selectHeader,
    selectNested,
    selectSnippetColumn,

    registerThemeHomepageTour,
};
});
