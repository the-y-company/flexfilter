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
    this.groups = false;

    this.values = {};
    this.hasSearch = false;
  }

  init() {
    fetch(this.pathVariables)
      .then((res) => res.json())
      .then((data) => {
        let groups = data.map((el) => el.group);
        groups = [...new Set(groups)].filter((el) => el != null);

        if (!groups.length) {
          this.#variableInput(data);
          return;
        }

        this.groups = true;
        this.#variableInputGroup(data, groups);
      });
  }

  #makeId() {
    return "_" + Math.ceil(Math.random() * 10000000);
  }

  #bindRemove(data, id) {
    $(`#${id} .filter-remove`).on("click", (event) => {
      $(event.target).closest(".card").remove();

      if (!this.groups) {
        $(`#${this.ns}-variables`).append(
          `<li><a class="dropdown-item ${this.ns}-var" data-value="${
            data.name
          }">${data.label || data.name}</a></li>`,
        );
      } else {
        $(
          `<li><a class="dropdown-item ${this.ns}-var" data-value="${
            data.name
          }">${data.label || data.name}</a></li>`,
        ).insertAfter(
          $(`#${this.ns}-variables`)
            .find(`[data-group="${data.group}"]`)
            .parent(),
        );
      }
      this.#bindVariableAdd();
      delete this.values[data.name];
      this.#send();
    });
  }

  #variableInputGroup(data, groups) {
    let opts = groups
      .map((group) => {
        const items = data.filter((el) => el.group == group);

        let groupItem = `<li class="p-2"><strong data-group="${group}" class="fw-bold">${group}</strong></li>`;

        let groupOpts = items
          .map((el) => {
            return `<li><a style="white-space: pre-wrap;cursor:pointer;" class="dropdown-item ${
              this.ns
            }-var" data-value="${el.name}">${el.label || el.name}</a></li>`;
          })
          .join("");

        return groupItem + groupOpts;
      })
      .join("");

    const id = this.#makeId();
    if (data.length > this.threshold) {
      this.hasSearch = true;
      opts = `<li><input id="${id}" placeholder="Search" type="text" class="form-control p-2" />${opts}<li>`;
    }

    $(`#${this.ns}-variables`).html(opts);
    this.#bindVariableAdd();
    this.#handleSearch(id);
  }

  #variableInput(data) {
    let opts = data
      .map((el) => {
        return `<li><a style="white-space: pre-wrap;cursor:pointer;" class="dropdown-item ${
          this.ns
        }-var" data-value="${el.name}">${el.label || el.name}</a></li>`;
      })
      .join("");

    const id = this.#makeId();
    if (data.length > this.threshold) {
      this.hasSearch = true;
      opts = `<li><input id="${id}" placeholder="Search" type="text" class="form-control dropdown-item" />${opts}<li>`;
    }

    $(`#${this.ns}-variables`).html(opts);
    this.#bindVariableAdd();
    this.#handleSearch(id);
  }

  #handleSearch(id) {
    if ($(`#${id}`).length == 0) {
      return;
    }

    let timeout;

    $(`#${id}`).off("keyup");
    $(`#${id}`).on("keyup", (e) => {
      clearTimeout(timeout);

      setTimeout(() => {
        let query = $(e.target).val().toLowerCase();

        $(`#${this.ns}-variables`)
          .find("li")
          .each((i, el) => {
            if (i == 0) {
              return;
            }

            let value = $(el).find("strong").data("group");

            if (!value) value = $(el).find("a").data("value");

            if (!value) return;

            value = value.toLowerCase();

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
            <a class="float-right filter-remove"><i class="fa fa-trash text-warning"></i></a>
          </div>
        </div>
        ${this.variablesOnly ? "" : content}
      </div>
    </div>`;
    $(`#${this.ns}-filters`).append(card);
    this.#bindRemove(data, id);
  }

  #send() {
    Shiny.setInputValue(`${this.ns}-values`, this.values);
  }

  #insertNumeric(data) {
    const id = this.#makeId();
    const input = `<input id="${id}" type="text" class="js-range-slider filter-input" value="" />`;
    this.#appendFilter(data, input);
    $(`#${id}`).ionRangeSlider({
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
      this.values[data.name] = $(event.target)
        .val()
        .split(";")
        .map((el) => parseFloat(el));
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.#send();
      }, 250);
    });
  }

  #insertCharacter(data) {
    const id = this.#makeId();
    const input = `<input id="${id}" value="" type="text" class="form-control filter-input"/>`;
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
    const opts = data.values
      .map((el) => {
        if (el == "null") {
          return "";
        }

        if (el == null) {
          return;
        }

        return `<option value="${el}">${el}</option>`;
      })
      .join("");

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
    $(`#${id}`).on("change", (event) => {
      let val = $(event.target).val();
      if (val.length == 0) {
        delete this.values[data.name];
        this.#send();
      }
      this.values[data.name] = val;
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
      $(event.target)
        .closest(".input-group")
        .find("input")
        .each((i, el) => {
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
      $(event.target)
        .closest(".logical-filter")
        .find("input")
        .each((i, el) => {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGlDQUFpQyxXQUFXO1dBQzVDO1dBQ0E7Ozs7O1dDUEE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7O0FDTjJCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmxleGZpbHRlci8uL3NyY2pzL2ZpbHRlci9pbmRleC5qcyIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyLy4vc3JjanMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgRmlsdGVyIHtcbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIHRoaXMucGF0aFZhcmlhYmxlcyA9IG9wdHMucGF0aFZhcmlhYmxlcztcbiAgICB0aGlzLnBhdGhWYXJpYWJsZSA9IG9wdHMucGF0aFZhcmlhYmxlO1xuICAgIHRoaXMubnMgPSBvcHRzLm5zO1xuICAgIHRoaXMudmFyaWFibGVzT25seSA9IG9wdHMudmFyaWFibGVzT25seTtcbiAgICB0aGlzLnRocmVzaG9sZCA9IG9wdHMuc2VhcmNoVGhyZXNob2xkO1xuICAgIHRoaXMuZ3JvdXBzID0gZmFsc2U7XG5cbiAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIHRoaXMuaGFzU2VhcmNoID0gZmFsc2U7XG4gIH1cblxuICBpbml0KCkge1xuICAgIGZldGNoKHRoaXMucGF0aFZhcmlhYmxlcylcbiAgICAgIC50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICBsZXQgZ3JvdXBzID0gZGF0YS5tYXAoKGVsKSA9PiBlbC5ncm91cCk7XG4gICAgICAgIGdyb3VwcyA9IFsuLi5uZXcgU2V0KGdyb3VwcyldLmZpbHRlcigoZWwpID0+IGVsICE9IG51bGwpO1xuXG4gICAgICAgIGlmICghZ3JvdXBzLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuI3ZhcmlhYmxlSW5wdXQoZGF0YSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ncm91cHMgPSB0cnVlO1xuICAgICAgICB0aGlzLiN2YXJpYWJsZUlucHV0R3JvdXAoZGF0YSwgZ3JvdXBzKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgI21ha2VJZCgpIHtcbiAgICByZXR1cm4gXCJfXCIgKyBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwKTtcbiAgfVxuXG4gICNiaW5kUmVtb3ZlKGRhdGEsIGlkKSB7XG4gICAgJChgIyR7aWR9IC5maWx0ZXItcmVtb3ZlYCkub24oXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFwiLmNhcmRcIikucmVtb3ZlKCk7XG5cbiAgICAgIGlmICghdGhpcy5ncm91cHMpIHtcbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuYXBwZW5kKFxuICAgICAgICAgIGA8bGk+PGEgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7dGhpcy5uc30tdmFyXCIgZGF0YS12YWx1ZT1cIiR7XG4gICAgICAgICAgICBkYXRhLm5hbWVcbiAgICAgICAgICB9XCI+JHtkYXRhLmxhYmVsIHx8IGRhdGEubmFtZX08L2E+PC9saT5gLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJChcbiAgICAgICAgICBgPGxpPjxhIGNsYXNzPVwiZHJvcGRvd24taXRlbSAke3RoaXMubnN9LXZhclwiIGRhdGEtdmFsdWU9XCIke1xuICAgICAgICAgICAgZGF0YS5uYW1lXG4gICAgICAgICAgfVwiPiR7ZGF0YS5sYWJlbCB8fCBkYXRhLm5hbWV9PC9hPjwvbGk+YCxcbiAgICAgICAgKS5pbnNlcnRBZnRlcihcbiAgICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKVxuICAgICAgICAgICAgLmZpbmQoYFtkYXRhLWdyb3VwPVwiJHtkYXRhLmdyb3VwfVwiXWApXG4gICAgICAgICAgICAucGFyZW50KCksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICB0aGlzLiNiaW5kVmFyaWFibGVBZGQoKTtcbiAgICAgIGRlbGV0ZSB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgIH0pO1xuICB9XG5cbiAgI3ZhcmlhYmxlSW5wdXRHcm91cChkYXRhLCBncm91cHMpIHtcbiAgICBsZXQgb3B0cyA9IGdyb3Vwc1xuICAgICAgLm1hcCgoZ3JvdXApID0+IHtcbiAgICAgICAgY29uc3QgaXRlbXMgPSBkYXRhLmZpbHRlcigoZWwpID0+IGVsLmdyb3VwID09IGdyb3VwKTtcblxuICAgICAgICBsZXQgZ3JvdXBJdGVtID0gYDxsaSBjbGFzcz1cInAtMlwiPjxzdHJvbmcgZGF0YS1ncm91cD1cIiR7Z3JvdXB9XCIgY2xhc3M9XCJmdy1ib2xkXCI+JHtncm91cH08L3N0cm9uZz48L2xpPmA7XG5cbiAgICAgICAgbGV0IGdyb3VwT3B0cyA9IGl0ZW1zXG4gICAgICAgICAgLm1hcCgoZWwpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgPGxpPjxhIHN0eWxlPVwid2hpdGUtc3BhY2U6IHByZS13cmFwO2N1cnNvcjpwb2ludGVyO1wiIGNsYXNzPVwiZHJvcGRvd24taXRlbSAke1xuICAgICAgICAgICAgICB0aGlzLm5zXG4gICAgICAgICAgICB9LXZhclwiIGRhdGEtdmFsdWU9XCIke2VsLm5hbWV9XCI+JHtlbC5sYWJlbCB8fCBlbC5uYW1lfTwvYT48L2xpPmA7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuam9pbihcIlwiKTtcblxuICAgICAgICByZXR1cm4gZ3JvdXBJdGVtICsgZ3JvdXBPcHRzO1xuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXCIpO1xuXG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBpZiAoZGF0YS5sZW5ndGggPiB0aGlzLnRocmVzaG9sZCkge1xuICAgICAgdGhpcy5oYXNTZWFyY2ggPSB0cnVlO1xuICAgICAgb3B0cyA9IGA8bGk+PGlucHV0IGlkPVwiJHtpZH1cIiBwbGFjZWhvbGRlcj1cIlNlYXJjaFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgcC0yXCIgLz4ke29wdHN9PGxpPmA7XG4gICAgfVxuXG4gICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuaHRtbChvcHRzKTtcbiAgICB0aGlzLiNiaW5kVmFyaWFibGVBZGQoKTtcbiAgICB0aGlzLiNoYW5kbGVTZWFyY2goaWQpO1xuICB9XG5cbiAgI3ZhcmlhYmxlSW5wdXQoZGF0YSkge1xuICAgIGxldCBvcHRzID0gZGF0YVxuICAgICAgLm1hcCgoZWwpID0+IHtcbiAgICAgICAgcmV0dXJuIGA8bGk+PGEgc3R5bGU9XCJ3aGl0ZS1zcGFjZTogcHJlLXdyYXA7Y3Vyc29yOnBvaW50ZXI7XCIgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7XG4gICAgICAgICAgdGhpcy5uc1xuICAgICAgICB9LXZhclwiIGRhdGEtdmFsdWU9XCIke2VsLm5hbWV9XCI+JHtlbC5sYWJlbCB8fCBlbC5uYW1lfTwvYT48L2xpPmA7XG4gICAgICB9KVxuICAgICAgLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGlmIChkYXRhLmxlbmd0aCA+IHRoaXMudGhyZXNob2xkKSB7XG4gICAgICB0aGlzLmhhc1NlYXJjaCA9IHRydWU7XG4gICAgICBvcHRzID0gYDxsaT48aW5wdXQgaWQ9XCIke2lkfVwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoXCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbCBkcm9wZG93bi1pdGVtXCIgLz4ke29wdHN9PGxpPmA7XG4gICAgfVxuXG4gICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuaHRtbChvcHRzKTtcbiAgICB0aGlzLiNiaW5kVmFyaWFibGVBZGQoKTtcbiAgICB0aGlzLiNoYW5kbGVTZWFyY2goaWQpO1xuICB9XG5cbiAgI2hhbmRsZVNlYXJjaChpZCkge1xuICAgIGlmICgkKGAjJHtpZH1gKS5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0O1xuXG4gICAgJChgIyR7aWR9YCkub2ZmKFwia2V5dXBcIik7XG4gICAgJChgIyR7aWR9YCkub24oXCJrZXl1cFwiLCAoZSkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gJChlLnRhcmdldCkudmFsKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKVxuICAgICAgICAgIC5maW5kKFwibGlcIilcbiAgICAgICAgICAuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICAgIGlmIChpID09IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSAkKGVsKS5maW5kKFwic3Ryb25nXCIpLmRhdGEoXCJncm91cFwiKTtcblxuICAgICAgICAgICAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAkKGVsKS5maW5kKFwiYVwiKS5kYXRhKFwidmFsdWVcIik7XG5cbiAgICAgICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUuaW5jbHVkZXMocXVlcnkpKSB7XG4gICAgICAgICAgICAgICQoZWwpLnNob3coKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgdGV4dCA9ICQoZWwpLnRleHQoKTtcblxuICAgICAgICAgICAgaWYgKHRleHQuaW5jbHVkZXMocXVlcnkpKSB7XG4gICAgICAgICAgICAgICQoZWwpLnNob3coKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkKGVsKS5oaWRlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9LCAyNTApO1xuICAgIH0pO1xuICB9XG5cbiAgI2JpbmRWYXJpYWJsZUFkZCgpIHtcbiAgICAkKGAuJHt0aGlzLm5zfS12YXJgKS5vZmYoKTtcbiAgICAkKGAuJHt0aGlzLm5zfS12YXJgKS5vbihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICBsZXQgdmFsdWUgPSAkKGUudGFyZ2V0KS5kYXRhKFwidmFsdWVcIik7XG5cbiAgICAgIC8vIHJlbW92ZSB2YXJpYWJsZSBmcm9tIGRyb3Bkb3duXG4gICAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KFwibGlcIikucmVtb3ZlKCk7XG5cbiAgICAgIGZldGNoKGAke3RoaXMucGF0aFZhcmlhYmxlfSZ2YXJpYWJsZT0ke2VuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSl9YClcbiAgICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICB0aGlzLiNpbnNlcnRJbnB1dChkYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLmhhc1NlYXJjaCkge1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5maW5kKFwiLmRyb3Bkb3duLWl0ZW1cIikudmFsKFwiXCIpO1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5maW5kKFwiLmRyb3Bkb3duLWl0ZW1cIikuc2hvdygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydElucHV0KGlucHV0KSB7XG4gICAgc3dpdGNoIChpbnB1dC50eXBlKSB7XG4gICAgICBjYXNlIFwibnVtZXJpY1wiOlxuICAgICAgICB0aGlzLiNpbnNlcnROdW1lcmljKGlucHV0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZmFjdG9yXCI6XG4gICAgICAgIHRoaXMuI2luc2VydEZhY3RvcihpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImRhdGVcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0RGF0ZShpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImxvZ2ljYWxcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0TG9naWNhbChpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy4jaW5zZXJ0Q2hhcmFjdGVyKGlucHV0KTtcbiAgICB9XG4gIH1cblxuICAjYXBwZW5kRmlsdGVyKGRhdGEsIGNvbnRlbnQpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGNhcmQgPSBgPGRpdiBpZD0ke2lkfSBkYXRhLW5hbWU9XCIke2RhdGEubmFtZX1cIiBjbGFzcz1cImNhcmQgbWItMVwiPlxuICAgICAgPGRpdiBjbGFzcz1cImNhcmQtYm9keVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZC1mbGV4XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZsZXgtZ3Jvdy0xXCI+XG4gICAgICAgICAgICAke2RhdGEubGFiZWwgfHwgZGF0YS5uYW1lfVxuICAgICAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LW11dGVkIHAtMCBtLTBcIj4ke2RhdGEuZGVzY3JpcHRpb24gfHwgXCJcIn08L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZsZXgtc2hyaW5rLTFcIj5cbiAgICAgICAgICAgIDxhIGNsYXNzPVwiZmxvYXQtcmlnaHQgZmlsdGVyLXJlbW92ZVwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggdGV4dC13YXJuaW5nXCI+PC9pPjwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgICR7dGhpcy52YXJpYWJsZXNPbmx5ID8gXCJcIiA6IGNvbnRlbnR9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICAgICQoYCMke3RoaXMubnN9LWZpbHRlcnNgKS5hcHBlbmQoY2FyZCk7XG4gICAgdGhpcy4jYmluZFJlbW92ZShkYXRhLCBpZCk7XG4gIH1cblxuICAjc2VuZCgpIHtcbiAgICBTaGlueS5zZXRJbnB1dFZhbHVlKGAke3RoaXMubnN9LXZhbHVlc2AsIHRoaXMudmFsdWVzKTtcbiAgfVxuXG4gICNpbnNlcnROdW1lcmljKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxpbnB1dCBpZD1cIiR7aWR9XCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImpzLXJhbmdlLXNsaWRlciBmaWx0ZXItaW5wdXRcIiB2YWx1ZT1cIlwiIC8+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuICAgICQoYCMke2lkfWApLmlvblJhbmdlU2xpZGVyKHtcbiAgICAgIG1pbjogZGF0YS5taW4sXG4gICAgICBtYXg6IGRhdGEubWF4LFxuICAgICAgc2tpbjogXCJzaGlueVwiLFxuICAgICAgZ3JpZDogdHJ1ZSxcbiAgICAgIHN0ZXA6IGRhdGEuc3RlcCxcbiAgICAgIHR5cGU6IFwiZG91YmxlXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gW2RhdGEubWluLCBkYXRhLm1heF07XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0O1xuICAgICQoYCMke2lkfWApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9ICQoZXZlbnQudGFyZ2V0KVxuICAgICAgICAudmFsKClcbiAgICAgICAgLnNwbGl0KFwiO1wiKVxuICAgICAgICAubWFwKChlbCkgPT4gcGFyc2VGbG9hdChlbCkpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICB9LCAyNTApO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydENoYXJhY3RlcihkYXRhKSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9IGA8aW5wdXQgaWQ9XCIke2lkfVwiIHZhbHVlPVwiXCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbCBmaWx0ZXItaW5wdXRcIi8+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBcIlwiO1xuICAgIHRoaXMuI3NlbmQoKTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgdGltZW91dDtcbiAgICAkKGAjJHtpZH1gKS5vbihcImtleXVwXCIsIChldmVudCkgPT4ge1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9ICQoZXZlbnQudGFyZ2V0KS52YWwoKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgfSwgMjUwKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRGYWN0b3IoZGF0YSkge1xuICAgIGNvbnN0IG9wdHMgPSBkYXRhLnZhbHVlc1xuICAgICAgLm1hcCgoZWwpID0+IHtcbiAgICAgICAgaWYgKGVsID09IFwibnVsbFwiKSB7XG4gICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWwgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBgPG9wdGlvbiB2YWx1ZT1cIiR7ZWx9XCI+JHtlbH08L29wdGlvbj5gO1xuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXCIpO1xuXG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9IGA8c2VsZWN0IGlkPVwiJHtpZH1cIiBjbGFzcz1cImZpbHRlci1pbnB1dFwiPiR7b3B0c308L3NlbGVjdD5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gXCJcIjtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAkKGAjJHtpZH1gKS5zZWxlY3RpemUoe1xuICAgICAgbWF4SXRlbXM6IDk5OTksXG4gICAgfSk7XG4gICAgJChgIyR7aWR9YClbMF0uc2VsZWN0aXplLnNldFZhbHVlKG51bGwpO1xuICAgICQoYCMke2lkfWApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgbGV0IHZhbCA9ICQoZXZlbnQudGFyZ2V0KS52YWwoKTtcbiAgICAgIGlmICh2YWwubGVuZ3RoID09IDApIHtcbiAgICAgICAgZGVsZXRlIHRoaXMudmFsdWVzW2RhdGEubmFtZV07XG4gICAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSB2YWw7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0RGF0ZShkYXRhKSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9IGA8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAgaW5wdXQtZGF0ZXJhbmdlIGZpbHRlci1pbnB1dFwiPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImRhdGVcIiBjbGFzcz1cImZvcm0tY29udHJvbCAke2lkfS1kYXRlXCIgdmFsdWU9XCIke2RhdGEubWlufVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtdGV4dFwiPnRvPC9kaXY+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiZGF0ZVwiIGNsYXNzPVwiZm9ybS1jb250cm9sICR7aWR9LWRhdGVcIiB2YWx1ZT1cIiR7ZGF0YS5tYXh9XCI+XG4gICAgICA8L2Rpdj5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFtkYXRhLm1pbiwgZGF0YS5tYXhdO1xuICAgIHRoaXMuI3NlbmQoKTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAkKGAuJHtpZH0tZGF0ZWApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgbGV0IHZhbHVlcyA9IFtdO1xuICAgICAgJChldmVudC50YXJnZXQpXG4gICAgICAgIC5jbG9zZXN0KFwiLmlucHV0LWdyb3VwXCIpXG4gICAgICAgIC5maW5kKFwiaW5wdXRcIilcbiAgICAgICAgLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgdmFsdWVzLnB1c2goJChlbCkudmFsKCkpO1xuICAgICAgICB9KTtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSB2YWx1ZXM7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0TG9naWNhbChkYXRhKSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9IGA8ZGl2IGNsYXNzPVwibG9naWNhbC1maWx0ZXJcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmb3JtLWNoZWNrIGZpbHRlci1pbnB1dFwiPlxuICAgICAgICA8aW5wdXQgY2xhc3M9XCJmb3JtLWNoZWNrLWlucHV0ICR7aWR9LWxvZ2ljYWxcIiB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPlxuICAgICAgICA8bGFiZWwgY2xhc3M9XCJmb3JtLWNoZWNrLWxhYmVsXCI+XG4gICAgICAgICAgVFJVRVxuICAgICAgICA8L2xhYmVsPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZm9ybS1jaGVja1wiPlxuICAgICAgICA8aW5wdXQgY2xhc3M9XCJmb3JtLWNoZWNrLWlucHV0ICR7aWR9LWxvZ2ljYWxcIiB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPlxuICAgICAgICA8bGFiZWwgY2xhc3M9XCJmb3JtLWNoZWNrLWxhYmVsXCI+XG4gICAgICAgICAgRkFMU0VcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvZGl2PlxuICAgIDxkaXY+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBbdHJ1ZSwgZmFsc2VdO1xuICAgIHRoaXMuI3NlbmQoKTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAkKGAuJHtpZH0tbG9naWNhbGApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgbGV0IHZhbHVlcyA9IFtdO1xuICAgICAgJChldmVudC50YXJnZXQpXG4gICAgICAgIC5jbG9zZXN0KFwiLmxvZ2ljYWwtZmlsdGVyXCIpXG4gICAgICAgIC5maW5kKFwiaW5wdXRcIilcbiAgICAgICAgLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgbGV0IHZhbCA9IHRydWU7XG4gICAgICAgICAgaWYgKGkgPT0gMSkge1xuICAgICAgICAgICAgdmFsID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCEkKGVsKS5pcyhcIjpjaGVja2VkXCIpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFsdWVzLnB1c2godmFsKTtcbiAgICAgICAgfSk7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gdmFsdWVzO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgIH0pO1xuICB9XG59XG5cbiQoKCkgPT4ge1xuICBTaGlueS5hZGRDdXN0b21NZXNzYWdlSGFuZGxlcihcImZsZXhmaWx0ZXItZW5kcG9pbnRzXCIsIChtc2cpID0+IHtcbiAgICBjb25zdCBmaWx0ZXIgPSBuZXcgRmlsdGVyKG1zZyk7XG4gICAgZmlsdGVyLmluaXQoKTtcbiAgfSk7XG59KTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgXCIuL2ZpbHRlci9pbmRleC5qc1wiO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9