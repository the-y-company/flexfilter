/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./srcjs/filter/index.js":
/*!*******************************!*\
  !*** ./srcjs/filter/index.js ***!
  \*******************************/
/***/ (() => {

class Filter {
  constructor(opts) {
    this.pathVariables = opts.pathVariables;
    this.pathVariable = opts.pathVariable;
    this.ns = opts.ns;
    this.variablesOnly = opts.variablesOnly;
    this.threshold = opts.searchThreshold;

    this.values = {};
    this.hasSearch = false;
  }

  init() {
    fetch(this.pathVariables)
      .then((res) => res.json())
      .then((data) => {
        let groups = data.map((el) => el.group);
        groups = [...new Set(groups)];

        if (!groups.length) {
          this.#variableInput(data);
          return;
        }

        this.#variableInputGroup(data, groups);
      });
  }

  #makeId() {
    return "_" + Math.ceil(Math.random() * 10000000);
  }

  #variableInputGroup(data, groups) {
    let opts = groups.map((group) => {
      const items = data.filter((el) => el.group == group);

      let groupItem = `<li><strong class="p-2 fw-bold">${group}</strong></li>`;

      let groupOpts = items.map((el) => {
        return `<li><a style="white-space: pre-wrap;cursor:pointer;" class="dropdown-item ${this.ns}-var" data-value="${el.name}">${
          el.label || el.name
        }</a></li>`;
      }).join("");

      return groupItem + groupOpts;
    }).join("");

    const id = this.#makeId();
    if (data.length > this.threshold) {
      this.hasSearch = true;
      opts =
        `<li><input id="${id}" placeholder="Search" type="text" class="form-control dropdown-item" />${opts}<li>`;
    }

    $(`#${this.ns}-variables`).html(
      opts,
    );
    this.#bindVariableAdd();
    this.#handleSearch(id);
  }

  #variableInput(data) {
    let opts = data.map((el) => {
      return `<li><a style="white-space: pre-wrap;cursor:pointer;" class="dropdown-item ${this.ns}-var" data-value="${el.name}">${
        el.label || el.name
      }</a></li>`;
    }).join("");

    const id = this.#makeId();
    if (data.length > this.threshold) {
      this.hasSearch = true;
      opts =
        `<li><input id="${id}" placeholder="Search" type="text" class="form-control dropdown-item" />${opts}<li>`;
    }

    $(`#${this.ns}-variables`).html(
      opts,
    );
    this.#bindVariableAdd();
    this.#handleSearch(id);
  }

  #handleSearch(id) {
    if ($(`#${id}`).length == 0) {
      return;
    }

    let timeout;

    $(`#${id}`).on("keyup", (e) => {
      clearTimeout(timeout);

      setTimeout(() => {
        let query = $(e.target).val().toLowerCase();

        $(`#${this.ns}-variables`).find(".dropdown-item").each((i, el) => {
          if (i == 0) {
            return;
          }

          let value = $(el).data("value").toLowerCase();

          if (value.includes(query)) {
            $(el).show();
            return;
          }

          let text = $(el).text();

          if (text.includes(query)) {
            $(el).show();
            return;
          }

          $(el).hide();
        });
      }, 250);
    });
  }

  #bindVariableAdd() {
    $(`.${this.ns}-var`).off();
    $(`.${this.ns}-var`).on("click", (e) => {
      let value = $(e.target).data("value");

      // remove variable from dropdown
      $(e.target).closest("li").remove();

      fetch(`${this.pathVariable}&variable=${encodeURIComponent(value)}`)
        .then((res) => res.json())
        .then((data) => {
          this.#insertInput(data);
        });

      if (this.hasSearch) {
        $(`#${this.ns}-variables`).find(".dropdown-item").val("");
        $(`#${this.ns}-variables`).find(".dropdown-item").show();
      }
    });
  }

  #insertInput(input) {
    switch (input.type) {
      case "numeric":
        this.#insertNumeric(input);
        break;
      case "factor":
        this.#insertFactor(input);
        break;
      case "date":
        this.#insertDate(input);
        break;
      case "logical":
        this.#insertLogical(input);
        break;
      default:
        this.#insertCharacter(input);
    }
  }

  #appendFilter(data, content) {
    const id = this.#makeId();
    const card = `<div id=${id} data-name="${data.name}" class="card mb-1">
      <div class="card-body">
        <div class="d-flex">
          <div class="flex-grow-1">
            ${data.label || data.name}
            <p class="text-muted p-0 m-0">${data.description || ""}</p>
          </div>
          <div class="flex-shrink-1">
            <a class="float-right filter-remove"><i class="fa fa-trash text-danger"></i></a>
          </div>
        </div>
        ${this.variablesOnly ? "" : content}
      </div>
    </div>`;
    $(`#${this.ns}-filters`).append(card);
    this.#bindRemove(data, id);
  }

  #bindRemove(data, id) {
    $(`#${id} .filter-remove`).on("click", (event) => {
      $(event.target).closest(".card").remove();

      $(`#${this.ns}-variables`).append(
        `<li><a class="dropdown-item ${this.ns}-var" data-value="${data.name}">${
          data.label || data.name
        }</a></li>`,
      );
      this.#bindVariableAdd();
      delete this.values[data.name];
      this.#send();
    });
  }

  #send() {
    Shiny.setInputValue(
      `${this.ns}-values`,
      this.values,
    );
  }

  #insertNumeric(data) {
    const id = this.#makeId();
    const input =
      `<input id="${id}" type="text" class="js-range-slider filter-input" value="" />`;
    this.#appendFilter(data, input);
    $(`#${id}`)
      .ionRangeSlider({
        min: data.min,
        max: data.max,
        skin: "shiny",
        grid: true,
        step: data.step,
        type: "double",
      });

    this.values[data.name] = [data.min, data.max];
    this.#send();

    if (this.variablesOnly) {
      return;
    }

    let timeout;
    $(`#${id}`).on("change", (event) => {
      this.values[data.name] = $(event.target).val().split(";").map((el) =>
        parseFloat(el)
      );
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.#send();
      }, 250);
    });
  }

  #insertCharacter(data) {
    const id = this.#makeId();
    const input =
      `<input id="${id}" value="" type="text" class="form-control filter-input"/>`;
    this.#appendFilter(data, input);
    this.values[data.name] = "";
    this.#send();

    if (this.variablesOnly) {
      return;
    }

    let timeout;
    $(`#${id}`).on("keyup", (event) => {
      this.values[data.name] = $(event.target).val();
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.#send();
      }, 250);
    });
  }

  #insertFactor(data) {
    const opts = data.values.map((el) => {
      return `<option value="${el}">${el}</option>`;
    }).join("");

    const id = this.#makeId();
    const input = `<select id="${id}" class="filter-input">${opts}</select>`;
    this.#appendFilter(data, input);

    if (this.variablesOnly) {
      this.values[data.name] = "";
      this.#send();
      return;
    }

    $(`#${id}`).selectize({
      maxItems: 9999,
    });
    $(`#${id}`)[0].selectize.setValue(null);
    this.values[data.name] = "";
    this.#send();
    $(`#${id}`).on("change", (event) => {
      console.log($(event.target).val());
      this.values[data.name] = $(event.target).val();
      this.#send();
    });
  }

  #insertDate(data) {
    const id = this.#makeId();
    const input = `<div class="input-group input-daterange filter-input">
        <input type="date" class="form-control ${id}-date" value="${data.min}">
        <div class="input-group-text">to</div>
        <input type="date" class="form-control ${id}-date" value="${data.max}">
      </div>`;
    this.#appendFilter(data, input);
    this.values[data.name] = [data.min, data.max];
    this.#send();

    if (this.variablesOnly) {
      return;
    }

    $(`.${id}-date`).on("change", (event) => {
      let values = [];
      $(event.target).closest(".input-group").find("input").each((i, el) => {
        values.push($(el).val());
      });
      this.values[data.name] = values;
      this.#send();
    });
  }

  #insertLogical(data) {
    const id = this.#makeId();
    const input = `<div class="logical-filter">
      <div class="form-check filter-input">
        <input class="form-check-input ${id}-logical" type="checkbox" checked>
        <label class="form-check-label">
          TRUE
        </label>
      </div>
      <div class="form-check">
        <input class="form-check-input ${id}-logical" type="checkbox" checked>
        <label class="form-check-label">
          FALSE
        </label>
      </div>
    <div>`;
    this.#appendFilter(data, input);
    this.values[data.name] = [true, false];
    this.#send();

    if (this.variablesOnly) {
      return;
    }

    $(`.${id}-logical`).on("change", (event) => {
      let values = [];
      $(event.target).closest(".logical-filter").find("input").each((i, el) => {
        let val = true;
        if (i == 1) {
          val = false;
        }

        if (!$(el).is(":checked")) {
          return;
        }

        values.push(val);
      });
      this.values[data.name] = values;
      this.#send();
    });
  }
}

$(() => {
  Shiny.addCustomMessageHandler("flexfilter-endpoints", (msg) => {
    const filter = new Filter(msg);
    filter.init();
  });
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!************************!*\
  !*** ./srcjs/index.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _filter_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./filter/index.js */ "./srcjs/filter/index.js");
/* harmony import */ var _filter_index_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_filter_index_js__WEBPACK_IMPORTED_MODULE_0__);


})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Ozs7Ozs7Ozs7O0FDTjJCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmxleGZpbHRlci8uL3NyY2pzL2ZpbHRlci9pbmRleC5qcyIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyLy4vc3JjanMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgRmlsdGVyIHtcbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIHRoaXMucGF0aFZhcmlhYmxlcyA9IG9wdHMucGF0aFZhcmlhYmxlcztcbiAgICB0aGlzLnBhdGhWYXJpYWJsZSA9IG9wdHMucGF0aFZhcmlhYmxlO1xuICAgIHRoaXMubnMgPSBvcHRzLm5zO1xuICAgIHRoaXMudmFyaWFibGVzT25seSA9IG9wdHMudmFyaWFibGVzT25seTtcbiAgICB0aGlzLnRocmVzaG9sZCA9IG9wdHMuc2VhcmNoVGhyZXNob2xkO1xuXG4gICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB0aGlzLmhhc1NlYXJjaCA9IGZhbHNlO1xuICB9XG5cbiAgaW5pdCgpIHtcbiAgICBmZXRjaCh0aGlzLnBhdGhWYXJpYWJsZXMpXG4gICAgICAudGhlbigocmVzKSA9PiByZXMuanNvbigpKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgbGV0IGdyb3VwcyA9IGRhdGEubWFwKChlbCkgPT4gZWwuZ3JvdXApO1xuICAgICAgICBncm91cHMgPSBbLi4ubmV3IFNldChncm91cHMpXTtcblxuICAgICAgICBpZiAoIWdyb3Vwcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLiN2YXJpYWJsZUlucHV0KGRhdGEpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI3ZhcmlhYmxlSW5wdXRHcm91cChkYXRhLCBncm91cHMpO1xuICAgICAgfSk7XG4gIH1cblxuICAjbWFrZUlkKCkge1xuICAgIHJldHVybiBcIl9cIiArIE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApO1xuICB9XG5cbiAgI3ZhcmlhYmxlSW5wdXRHcm91cChkYXRhLCBncm91cHMpIHtcbiAgICBsZXQgb3B0cyA9IGdyb3Vwcy5tYXAoKGdyb3VwKSA9PiB7XG4gICAgICBjb25zdCBpdGVtcyA9IGRhdGEuZmlsdGVyKChlbCkgPT4gZWwuZ3JvdXAgPT0gZ3JvdXApO1xuXG4gICAgICBsZXQgZ3JvdXBJdGVtID0gYDxsaT48c3Ryb25nIGNsYXNzPVwicC0yIGZ3LWJvbGRcIj4ke2dyb3VwfTwvc3Ryb25nPjwvbGk+YDtcblxuICAgICAgbGV0IGdyb3VwT3B0cyA9IGl0ZW1zLm1hcCgoZWwpID0+IHtcbiAgICAgICAgcmV0dXJuIGA8bGk+PGEgc3R5bGU9XCJ3aGl0ZS1zcGFjZTogcHJlLXdyYXA7Y3Vyc29yOnBvaW50ZXI7XCIgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7dGhpcy5uc30tdmFyXCIgZGF0YS12YWx1ZT1cIiR7ZWwubmFtZX1cIj4ke1xuICAgICAgICAgIGVsLmxhYmVsIHx8IGVsLm5hbWVcbiAgICAgICAgfTwvYT48L2xpPmA7XG4gICAgICB9KS5qb2luKFwiXCIpO1xuXG4gICAgICByZXR1cm4gZ3JvdXBJdGVtICsgZ3JvdXBPcHRzO1xuICAgIH0pLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGlmIChkYXRhLmxlbmd0aCA+IHRoaXMudGhyZXNob2xkKSB7XG4gICAgICB0aGlzLmhhc1NlYXJjaCA9IHRydWU7XG4gICAgICBvcHRzID1cbiAgICAgICAgYDxsaT48aW5wdXQgaWQ9XCIke2lkfVwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoXCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbCBkcm9wZG93bi1pdGVtXCIgLz4ke29wdHN9PGxpPmA7XG4gICAgfVxuXG4gICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuaHRtbChcbiAgICAgIG9wdHMsXG4gICAgKTtcbiAgICB0aGlzLiNiaW5kVmFyaWFibGVBZGQoKTtcbiAgICB0aGlzLiNoYW5kbGVTZWFyY2goaWQpO1xuICB9XG5cbiAgI3ZhcmlhYmxlSW5wdXQoZGF0YSkge1xuICAgIGxldCBvcHRzID0gZGF0YS5tYXAoKGVsKSA9PiB7XG4gICAgICByZXR1cm4gYDxsaT48YSBzdHlsZT1cIndoaXRlLXNwYWNlOiBwcmUtd3JhcDtjdXJzb3I6cG9pbnRlcjtcIiBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHt0aGlzLm5zfS12YXJcIiBkYXRhLXZhbHVlPVwiJHtlbC5uYW1lfVwiPiR7XG4gICAgICAgIGVsLmxhYmVsIHx8IGVsLm5hbWVcbiAgICAgIH08L2E+PC9saT5gO1xuICAgIH0pLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGlmIChkYXRhLmxlbmd0aCA+IHRoaXMudGhyZXNob2xkKSB7XG4gICAgICB0aGlzLmhhc1NlYXJjaCA9IHRydWU7XG4gICAgICBvcHRzID1cbiAgICAgICAgYDxsaT48aW5wdXQgaWQ9XCIke2lkfVwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoXCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbCBkcm9wZG93bi1pdGVtXCIgLz4ke29wdHN9PGxpPmA7XG4gICAgfVxuXG4gICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuaHRtbChcbiAgICAgIG9wdHMsXG4gICAgKTtcbiAgICB0aGlzLiNiaW5kVmFyaWFibGVBZGQoKTtcbiAgICB0aGlzLiNoYW5kbGVTZWFyY2goaWQpO1xuICB9XG5cbiAgI2hhbmRsZVNlYXJjaChpZCkge1xuICAgIGlmICgkKGAjJHtpZH1gKS5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0O1xuXG4gICAgJChgIyR7aWR9YCkub24oXCJrZXl1cFwiLCAoZSkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gJChlLnRhcmdldCkudmFsKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5maW5kKFwiLmRyb3Bkb3duLWl0ZW1cIikuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHZhbHVlID0gJChlbCkuZGF0YShcInZhbHVlXCIpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICBpZiAodmFsdWUuaW5jbHVkZXMocXVlcnkpKSB7XG4gICAgICAgICAgICAkKGVsKS5zaG93KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHRleHQgPSAkKGVsKS50ZXh0KCk7XG5cbiAgICAgICAgICBpZiAodGV4dC5pbmNsdWRlcyhxdWVyeSkpIHtcbiAgICAgICAgICAgICQoZWwpLnNob3coKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAkKGVsKS5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSwgMjUwKTtcbiAgICB9KTtcbiAgfVxuXG4gICNiaW5kVmFyaWFibGVBZGQoKSB7XG4gICAgJChgLiR7dGhpcy5uc30tdmFyYCkub2ZmKCk7XG4gICAgJChgLiR7dGhpcy5uc30tdmFyYCkub24oXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgbGV0IHZhbHVlID0gJChlLnRhcmdldCkuZGF0YShcInZhbHVlXCIpO1xuXG4gICAgICAvLyByZW1vdmUgdmFyaWFibGUgZnJvbSBkcm9wZG93blxuICAgICAgJChlLnRhcmdldCkuY2xvc2VzdChcImxpXCIpLnJlbW92ZSgpO1xuXG4gICAgICBmZXRjaChgJHt0aGlzLnBhdGhWYXJpYWJsZX0mdmFyaWFibGU9JHtlbmNvZGVVUklDb21wb25lbnQodmFsdWUpfWApXG4gICAgICAgIC50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgdGhpcy4jaW5zZXJ0SW5wdXQoZGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5oYXNTZWFyY2gpIHtcbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuZmluZChcIi5kcm9wZG93bi1pdGVtXCIpLnZhbChcIlwiKTtcbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuZmluZChcIi5kcm9wZG93bi1pdGVtXCIpLnNob3coKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRJbnB1dChpbnB1dCkge1xuICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgY2FzZSBcIm51bWVyaWNcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0TnVtZXJpYyhpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImZhY3RvclwiOlxuICAgICAgICB0aGlzLiNpbnNlcnRGYWN0b3IoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJkYXRlXCI6XG4gICAgICAgIHRoaXMuI2luc2VydERhdGUoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJsb2dpY2FsXCI6XG4gICAgICAgIHRoaXMuI2luc2VydExvZ2ljYWwoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMuI2luc2VydENoYXJhY3RlcihpbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgI2FwcGVuZEZpbHRlcihkYXRhLCBjb250ZW50KSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBjYXJkID0gYDxkaXYgaWQ9JHtpZH0gZGF0YS1uYW1lPVwiJHtkYXRhLm5hbWV9XCIgY2xhc3M9XCJjYXJkIG1iLTFcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImQtZmxleFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LWdyb3ctMVwiPlxuICAgICAgICAgICAgJHtkYXRhLmxhYmVsIHx8IGRhdGEubmFtZX1cbiAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1tdXRlZCBwLTAgbS0wXCI+JHtkYXRhLmRlc2NyaXB0aW9uIHx8IFwiXCJ9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LXNocmluay0xXCI+XG4gICAgICAgICAgICA8YSBjbGFzcz1cImZsb2F0LXJpZ2h0IGZpbHRlci1yZW1vdmVcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIHRleHQtZGFuZ2VyXCI+PC9pPjwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgICR7dGhpcy52YXJpYWJsZXNPbmx5ID8gXCJcIiA6IGNvbnRlbnR9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICAgICQoYCMke3RoaXMubnN9LWZpbHRlcnNgKS5hcHBlbmQoY2FyZCk7XG4gICAgdGhpcy4jYmluZFJlbW92ZShkYXRhLCBpZCk7XG4gIH1cblxuICAjYmluZFJlbW92ZShkYXRhLCBpZCkge1xuICAgICQoYCMke2lkfSAuZmlsdGVyLXJlbW92ZWApLm9uKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChcIi5jYXJkXCIpLnJlbW92ZSgpO1xuXG4gICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5hcHBlbmQoXG4gICAgICAgIGA8bGk+PGEgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7dGhpcy5uc30tdmFyXCIgZGF0YS12YWx1ZT1cIiR7ZGF0YS5uYW1lfVwiPiR7XG4gICAgICAgICAgZGF0YS5sYWJlbCB8fCBkYXRhLm5hbWVcbiAgICAgICAgfTwvYT48L2xpPmAsXG4gICAgICApO1xuICAgICAgdGhpcy4jYmluZFZhcmlhYmxlQWRkKCk7XG4gICAgICBkZWxldGUgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXTtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICNzZW5kKCkge1xuICAgIFNoaW55LnNldElucHV0VmFsdWUoXG4gICAgICBgJHt0aGlzLm5zfS12YWx1ZXNgLFxuICAgICAgdGhpcy52YWx1ZXMsXG4gICAgKTtcbiAgfVxuXG4gICNpbnNlcnROdW1lcmljKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID1cbiAgICAgIGA8aW5wdXQgaWQ9XCIke2lkfVwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJqcy1yYW5nZS1zbGlkZXIgZmlsdGVyLWlucHV0XCIgdmFsdWU9XCJcIiAvPmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICAkKGAjJHtpZH1gKVxuICAgICAgLmlvblJhbmdlU2xpZGVyKHtcbiAgICAgICAgbWluOiBkYXRhLm1pbixcbiAgICAgICAgbWF4OiBkYXRhLm1heCxcbiAgICAgICAgc2tpbjogXCJzaGlueVwiLFxuICAgICAgICBncmlkOiB0cnVlLFxuICAgICAgICBzdGVwOiBkYXRhLnN0ZXAsXG4gICAgICAgIHR5cGU6IFwiZG91YmxlXCIsXG4gICAgICB9KTtcblxuICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBbZGF0YS5taW4sIGRhdGEubWF4XTtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQ7XG4gICAgJChgIyR7aWR9YCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gJChldmVudC50YXJnZXQpLnZhbCgpLnNwbGl0KFwiO1wiKS5tYXAoKGVsKSA9PlxuICAgICAgICBwYXJzZUZsb2F0KGVsKVxuICAgICAgKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgfSwgMjUwKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRDaGFyYWN0ZXIoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPVxuICAgICAgYDxpbnB1dCBpZD1cIiR7aWR9XCIgdmFsdWU9XCJcIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIGZpbHRlci1pbnB1dFwiLz5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFwiXCI7XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0O1xuICAgICQoYCMke2lkfWApLm9uKFwia2V5dXBcIiwgKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gJChldmVudC50YXJnZXQpLnZhbCgpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICB9LCAyNTApO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydEZhY3RvcihkYXRhKSB7XG4gICAgY29uc3Qgb3B0cyA9IGRhdGEudmFsdWVzLm1hcCgoZWwpID0+IHtcbiAgICAgIHJldHVybiBgPG9wdGlvbiB2YWx1ZT1cIiR7ZWx9XCI+JHtlbH08L29wdGlvbj5gO1xuICAgIH0pLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxzZWxlY3QgaWQ9XCIke2lkfVwiIGNsYXNzPVwiZmlsdGVyLWlucHV0XCI+JHtvcHRzfTwvc2VsZWN0PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBcIlwiO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYCMke2lkfWApLnNlbGVjdGl6ZSh7XG4gICAgICBtYXhJdGVtczogOTk5OSxcbiAgICB9KTtcbiAgICAkKGAjJHtpZH1gKVswXS5zZWxlY3RpemUuc2V0VmFsdWUobnVsbCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFwiXCI7XG4gICAgdGhpcy4jc2VuZCgpO1xuICAgICQoYCMke2lkfWApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJChldmVudC50YXJnZXQpLnZhbCgpKTtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSAkKGV2ZW50LnRhcmdldCkudmFsKCk7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0RGF0ZShkYXRhKSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9IGA8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAgaW5wdXQtZGF0ZXJhbmdlIGZpbHRlci1pbnB1dFwiPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImRhdGVcIiBjbGFzcz1cImZvcm0tY29udHJvbCAke2lkfS1kYXRlXCIgdmFsdWU9XCIke2RhdGEubWlufVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtdGV4dFwiPnRvPC9kaXY+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiZGF0ZVwiIGNsYXNzPVwiZm9ybS1jb250cm9sICR7aWR9LWRhdGVcIiB2YWx1ZT1cIiR7ZGF0YS5tYXh9XCI+XG4gICAgICA8L2Rpdj5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFtkYXRhLm1pbiwgZGF0YS5tYXhdO1xuICAgIHRoaXMuI3NlbmQoKTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAkKGAuJHtpZH0tZGF0ZWApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgbGV0IHZhbHVlcyA9IFtdO1xuICAgICAgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoXCIuaW5wdXQtZ3JvdXBcIikuZmluZChcImlucHV0XCIpLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgIHZhbHVlcy5wdXNoKCQoZWwpLnZhbCgpKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IHZhbHVlcztcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRMb2dpY2FsKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxkaXYgY2xhc3M9XCJsb2dpY2FsLWZpbHRlclwiPlxuICAgICAgPGRpdiBjbGFzcz1cImZvcm0tY2hlY2sgZmlsdGVyLWlucHV0XCI+XG4gICAgICAgIDxpbnB1dCBjbGFzcz1cImZvcm0tY2hlY2staW5wdXQgJHtpZH0tbG9naWNhbFwiIHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImZvcm0tY2hlY2stbGFiZWxcIj5cbiAgICAgICAgICBUUlVFXG4gICAgICAgIDwvbGFiZWw+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmb3JtLWNoZWNrXCI+XG4gICAgICAgIDxpbnB1dCBjbGFzcz1cImZvcm0tY2hlY2staW5wdXQgJHtpZH0tbG9naWNhbFwiIHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImZvcm0tY2hlY2stbGFiZWxcIj5cbiAgICAgICAgICBGQUxTRVxuICAgICAgICA8L2xhYmVsPlxuICAgICAgPC9kaXY+XG4gICAgPGRpdj5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFt0cnVlLCBmYWxzZV07XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYC4ke2lkfS1sb2dpY2FsYCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgdmFsdWVzID0gW107XG4gICAgICAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChcIi5sb2dpY2FsLWZpbHRlclwiKS5maW5kKFwiaW5wdXRcIikuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgbGV0IHZhbCA9IHRydWU7XG4gICAgICAgIGlmIChpID09IDEpIHtcbiAgICAgICAgICB2YWwgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghJChlbCkuaXMoXCI6Y2hlY2tlZFwiKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbHVlcy5wdXNoKHZhbCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSB2YWx1ZXM7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cbn1cblxuJCgoKSA9PiB7XG4gIFNoaW55LmFkZEN1c3RvbU1lc3NhZ2VIYW5kbGVyKFwiZmxleGZpbHRlci1lbmRwb2ludHNcIiwgKG1zZykgPT4ge1xuICAgIGNvbnN0IGZpbHRlciA9IG5ldyBGaWx0ZXIobXNnKTtcbiAgICBmaWx0ZXIuaW5pdCgpO1xuICB9KTtcbn0pO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBcIi4vZmlsdGVyL2luZGV4LmpzXCI7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=