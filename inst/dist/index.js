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
          `<li><a class="dropdown-item ${this.ns}-var" data-value="${data.name}">${
            data.label || data.name
          }</a></li>`,
        );
      } else {
        $(
          `<li><a class="dropdown-item ${this.ns}-var" data-value="${data.name}">${
            data.label || data.name
          }</a></li>`,
        ).insertAfter(
          $(`#${this.ns}-variables`).find(`[data-group="${data.group}"]`),
        );
      }
      this.#bindVariableAdd();
      delete this.values[data.name];
      this.#send();
    });
  }

  #variableInputGroup(data, groups) {
    let opts = groups.map((group) => {
      const items = data.filter((el) => el.group == group);

      let groupItem =
        `<li class="p-2"><strong data-group="${group}" class="fw-bold">${group}</strong></li>`;

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
        `<li><input id="${id}" placeholder="Search" type="text" class="form-control p-2" />${opts}<li>`;
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
      if (el == "null") {
        return "";
      }

      if (el == null) {
        return;
      }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7V0FDQTtXQUNBO1dBQ0EsaUNBQWlDLFdBQVc7V0FDNUM7V0FDQTs7Ozs7V0NQQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBOzs7OztXQ1BBOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7Ozs7Ozs7QUNOMkIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mbGV4ZmlsdGVyLy4vc3JjanMvZmlsdGVyL2luZGV4LmpzIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2ZsZXhmaWx0ZXIvLi9zcmNqcy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBGaWx0ZXIge1xuICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgdGhpcy5wYXRoVmFyaWFibGVzID0gb3B0cy5wYXRoVmFyaWFibGVzO1xuICAgIHRoaXMucGF0aFZhcmlhYmxlID0gb3B0cy5wYXRoVmFyaWFibGU7XG4gICAgdGhpcy5ucyA9IG9wdHMubnM7XG4gICAgdGhpcy52YXJpYWJsZXNPbmx5ID0gb3B0cy52YXJpYWJsZXNPbmx5O1xuICAgIHRoaXMudGhyZXNob2xkID0gb3B0cy5zZWFyY2hUaHJlc2hvbGQ7XG4gICAgdGhpcy5ncm91cHMgPSBmYWxzZTtcblxuICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgdGhpcy5oYXNTZWFyY2ggPSBmYWxzZTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgZmV0Y2godGhpcy5wYXRoVmFyaWFibGVzKVxuICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGxldCBncm91cHMgPSBkYXRhLm1hcCgoZWwpID0+IGVsLmdyb3VwKTtcbiAgICAgICAgZ3JvdXBzID0gWy4uLm5ldyBTZXQoZ3JvdXBzKV0uZmlsdGVyKChlbCkgPT4gZWwgIT0gbnVsbCk7XG5cbiAgICAgICAgaWYgKCFncm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy4jdmFyaWFibGVJbnB1dChkYXRhKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyb3VwcyA9IHRydWU7XG4gICAgICAgIHRoaXMuI3ZhcmlhYmxlSW5wdXRHcm91cChkYXRhLCBncm91cHMpO1xuICAgICAgfSk7XG4gIH1cblxuICAjbWFrZUlkKCkge1xuICAgIHJldHVybiBcIl9cIiArIE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApO1xuICB9XG5cbiAgI2JpbmRSZW1vdmUoZGF0YSwgaWQpIHtcbiAgICAkKGAjJHtpZH0gLmZpbHRlci1yZW1vdmVgKS5vbihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoXCIuY2FyZFwiKS5yZW1vdmUoKTtcblxuICAgICAgaWYgKCF0aGlzLmdyb3Vwcykge1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5hcHBlbmQoXG4gICAgICAgICAgYDxsaT48YSBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHt0aGlzLm5zfS12YXJcIiBkYXRhLXZhbHVlPVwiJHtkYXRhLm5hbWV9XCI+JHtcbiAgICAgICAgICAgIGRhdGEubGFiZWwgfHwgZGF0YS5uYW1lXG4gICAgICAgICAgfTwvYT48L2xpPmAsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkKFxuICAgICAgICAgIGA8bGk+PGEgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7dGhpcy5uc30tdmFyXCIgZGF0YS12YWx1ZT1cIiR7ZGF0YS5uYW1lfVwiPiR7XG4gICAgICAgICAgICBkYXRhLmxhYmVsIHx8IGRhdGEubmFtZVxuICAgICAgICAgIH08L2E+PC9saT5gLFxuICAgICAgICApLmluc2VydEFmdGVyKFxuICAgICAgICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmZpbmQoYFtkYXRhLWdyb3VwPVwiJHtkYXRhLmdyb3VwfVwiXWApLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy4jYmluZFZhcmlhYmxlQWRkKCk7XG4gICAgICBkZWxldGUgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXTtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICN2YXJpYWJsZUlucHV0R3JvdXAoZGF0YSwgZ3JvdXBzKSB7XG4gICAgbGV0IG9wdHMgPSBncm91cHMubWFwKChncm91cCkgPT4ge1xuICAgICAgY29uc3QgaXRlbXMgPSBkYXRhLmZpbHRlcigoZWwpID0+IGVsLmdyb3VwID09IGdyb3VwKTtcblxuICAgICAgbGV0IGdyb3VwSXRlbSA9XG4gICAgICAgIGA8bGkgY2xhc3M9XCJwLTJcIj48c3Ryb25nIGRhdGEtZ3JvdXA9XCIke2dyb3VwfVwiIGNsYXNzPVwiZnctYm9sZFwiPiR7Z3JvdXB9PC9zdHJvbmc+PC9saT5gO1xuXG4gICAgICBsZXQgZ3JvdXBPcHRzID0gaXRlbXMubWFwKChlbCkgPT4ge1xuICAgICAgICByZXR1cm4gYDxsaT48YSBzdHlsZT1cIndoaXRlLXNwYWNlOiBwcmUtd3JhcDtjdXJzb3I6cG9pbnRlcjtcIiBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHt0aGlzLm5zfS12YXJcIiBkYXRhLXZhbHVlPVwiJHtlbC5uYW1lfVwiPiR7XG4gICAgICAgICAgZWwubGFiZWwgfHwgZWwubmFtZVxuICAgICAgICB9PC9hPjwvbGk+YDtcbiAgICAgIH0pLmpvaW4oXCJcIik7XG5cbiAgICAgIHJldHVybiBncm91cEl0ZW0gKyBncm91cE9wdHM7XG4gICAgfSkuam9pbihcIlwiKTtcblxuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgaWYgKGRhdGEubGVuZ3RoID4gdGhpcy50aHJlc2hvbGQpIHtcbiAgICAgIHRoaXMuaGFzU2VhcmNoID0gdHJ1ZTtcbiAgICAgIG9wdHMgPVxuICAgICAgICBgPGxpPjxpbnB1dCBpZD1cIiR7aWR9XCIgcGxhY2Vob2xkZXI9XCJTZWFyY2hcIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIHAtMlwiIC8+JHtvcHRzfTxsaT5gO1xuICAgIH1cblxuICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmh0bWwoXG4gICAgICBvcHRzLFxuICAgICk7XG4gICAgdGhpcy4jYmluZFZhcmlhYmxlQWRkKCk7XG4gICAgdGhpcy4jaGFuZGxlU2VhcmNoKGlkKTtcbiAgfVxuXG4gICN2YXJpYWJsZUlucHV0KGRhdGEpIHtcbiAgICBsZXQgb3B0cyA9IGRhdGEubWFwKChlbCkgPT4ge1xuICAgICAgcmV0dXJuIGA8bGk+PGEgc3R5bGU9XCJ3aGl0ZS1zcGFjZTogcHJlLXdyYXA7Y3Vyc29yOnBvaW50ZXI7XCIgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7dGhpcy5uc30tdmFyXCIgZGF0YS12YWx1ZT1cIiR7ZWwubmFtZX1cIj4ke1xuICAgICAgICBlbC5sYWJlbCB8fCBlbC5uYW1lXG4gICAgICB9PC9hPjwvbGk+YDtcbiAgICB9KS5qb2luKFwiXCIpO1xuXG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBpZiAoZGF0YS5sZW5ndGggPiB0aGlzLnRocmVzaG9sZCkge1xuICAgICAgdGhpcy5oYXNTZWFyY2ggPSB0cnVlO1xuICAgICAgb3B0cyA9XG4gICAgICAgIGA8bGk+PGlucHV0IGlkPVwiJHtpZH1cIiBwbGFjZWhvbGRlcj1cIlNlYXJjaFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgZHJvcGRvd24taXRlbVwiIC8+JHtvcHRzfTxsaT5gO1xuICAgIH1cblxuICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmh0bWwoXG4gICAgICBvcHRzLFxuICAgICk7XG4gICAgdGhpcy4jYmluZFZhcmlhYmxlQWRkKCk7XG4gICAgdGhpcy4jaGFuZGxlU2VhcmNoKGlkKTtcbiAgfVxuXG4gICNoYW5kbGVTZWFyY2goaWQpIHtcbiAgICBpZiAoJChgIyR7aWR9YCkubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgdGltZW91dDtcblxuICAgICQoYCMke2lkfWApLm9uKFwia2V5dXBcIiwgKGUpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGxldCBxdWVyeSA9ICQoZS50YXJnZXQpLnZhbCgpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuZmluZChcIi5kcm9wZG93bi1pdGVtXCIpLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgaWYgKGkgPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCB2YWx1ZSA9ICQoZWwpLmRhdGEoXCJ2YWx1ZVwiKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKHZhbHVlLmluY2x1ZGVzKHF1ZXJ5KSkge1xuICAgICAgICAgICAgJChlbCkuc2hvdygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCB0ZXh0ID0gJChlbCkudGV4dCgpO1xuXG4gICAgICAgICAgaWYgKHRleHQuaW5jbHVkZXMocXVlcnkpKSB7XG4gICAgICAgICAgICAkKGVsKS5zaG93KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgJChlbCkuaGlkZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sIDI1MCk7XG4gICAgfSk7XG4gIH1cblxuICAjYmluZFZhcmlhYmxlQWRkKCkge1xuICAgICQoYC4ke3RoaXMubnN9LXZhcmApLm9mZigpO1xuICAgICQoYC4ke3RoaXMubnN9LXZhcmApLm9uKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGxldCB2YWx1ZSA9ICQoZS50YXJnZXQpLmRhdGEoXCJ2YWx1ZVwiKTtcblxuICAgICAgLy8gcmVtb3ZlIHZhcmlhYmxlIGZyb20gZHJvcGRvd25cbiAgICAgICQoZS50YXJnZXQpLmNsb3Nlc3QoXCJsaVwiKS5yZW1vdmUoKTtcblxuICAgICAgZmV0Y2goYCR7dGhpcy5wYXRoVmFyaWFibGV9JnZhcmlhYmxlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKX1gKVxuICAgICAgICAudGhlbigocmVzKSA9PiByZXMuanNvbigpKVxuICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgIHRoaXMuI2luc2VydElucHV0KGRhdGEpO1xuICAgICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMuaGFzU2VhcmNoKSB7XG4gICAgICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmZpbmQoXCIuZHJvcGRvd24taXRlbVwiKS52YWwoXCJcIik7XG4gICAgICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmZpbmQoXCIuZHJvcGRvd24taXRlbVwiKS5zaG93KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0SW5wdXQoaW5wdXQpIHtcbiAgICBzd2l0Y2ggKGlucHV0LnR5cGUpIHtcbiAgICAgIGNhc2UgXCJudW1lcmljXCI6XG4gICAgICAgIHRoaXMuI2luc2VydE51bWVyaWMoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJmYWN0b3JcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0RmFjdG9yKGlucHV0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZGF0ZVwiOlxuICAgICAgICB0aGlzLiNpbnNlcnREYXRlKGlucHV0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwibG9naWNhbFwiOlxuICAgICAgICB0aGlzLiNpbnNlcnRMb2dpY2FsKGlucHV0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLiNpbnNlcnRDaGFyYWN0ZXIoaW5wdXQpO1xuICAgIH1cbiAgfVxuXG4gICNhcHBlbmRGaWx0ZXIoZGF0YSwgY29udGVudCkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgY2FyZCA9IGA8ZGl2IGlkPSR7aWR9IGRhdGEtbmFtZT1cIiR7ZGF0YS5uYW1lfVwiIGNsYXNzPVwiY2FyZCBtYi0xXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2FyZC1ib2R5XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJkLWZsZXhcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1ncm93LTFcIj5cbiAgICAgICAgICAgICR7ZGF0YS5sYWJlbCB8fCBkYXRhLm5hbWV9XG4gICAgICAgICAgICA8cCBjbGFzcz1cInRleHQtbXV0ZWQgcC0wIG0tMFwiPiR7ZGF0YS5kZXNjcmlwdGlvbiB8fCBcIlwifTwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1zaHJpbmstMVwiPlxuICAgICAgICAgICAgPGEgY2xhc3M9XCJmbG9hdC1yaWdodCBmaWx0ZXItcmVtb3ZlXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCB0ZXh0LXdhcm5pbmdcIj48L2k+PC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgJHt0aGlzLnZhcmlhYmxlc09ubHkgPyBcIlwiIDogY29udGVudH1cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG4gICAgJChgIyR7dGhpcy5uc30tZmlsdGVyc2ApLmFwcGVuZChjYXJkKTtcbiAgICB0aGlzLiNiaW5kUmVtb3ZlKGRhdGEsIGlkKTtcbiAgfVxuXG4gICNzZW5kKCkge1xuICAgIFNoaW55LnNldElucHV0VmFsdWUoXG4gICAgICBgJHt0aGlzLm5zfS12YWx1ZXNgLFxuICAgICAgdGhpcy52YWx1ZXMsXG4gICAgKTtcbiAgfVxuXG4gICNpbnNlcnROdW1lcmljKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID1cbiAgICAgIGA8aW5wdXQgaWQ9XCIke2lkfVwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJqcy1yYW5nZS1zbGlkZXIgZmlsdGVyLWlucHV0XCIgdmFsdWU9XCJcIiAvPmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICAkKGAjJHtpZH1gKVxuICAgICAgLmlvblJhbmdlU2xpZGVyKHtcbiAgICAgICAgbWluOiBkYXRhLm1pbixcbiAgICAgICAgbWF4OiBkYXRhLm1heCxcbiAgICAgICAgc2tpbjogXCJzaGlueVwiLFxuICAgICAgICBncmlkOiB0cnVlLFxuICAgICAgICBzdGVwOiBkYXRhLnN0ZXAsXG4gICAgICAgIHR5cGU6IFwiZG91YmxlXCIsXG4gICAgICB9KTtcblxuICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBbZGF0YS5taW4sIGRhdGEubWF4XTtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQ7XG4gICAgJChgIyR7aWR9YCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gJChldmVudC50YXJnZXQpLnZhbCgpLnNwbGl0KFwiO1wiKS5tYXAoKGVsKSA9PlxuICAgICAgICBwYXJzZUZsb2F0KGVsKVxuICAgICAgKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgfSwgMjUwKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRDaGFyYWN0ZXIoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPVxuICAgICAgYDxpbnB1dCBpZD1cIiR7aWR9XCIgdmFsdWU9XCJcIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIGZpbHRlci1pbnB1dFwiLz5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFwiXCI7XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0O1xuICAgICQoYCMke2lkfWApLm9uKFwia2V5dXBcIiwgKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gJChldmVudC50YXJnZXQpLnZhbCgpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICB9LCAyNTApO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydEZhY3RvcihkYXRhKSB7XG4gICAgY29uc3Qgb3B0cyA9IGRhdGEudmFsdWVzLm1hcCgoZWwpID0+IHtcbiAgICAgIGlmIChlbCA9PSBcIm51bGxcIikge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVsID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYDxvcHRpb24gdmFsdWU9XCIke2VsfVwiPiR7ZWx9PC9vcHRpb24+YDtcbiAgICB9KS5qb2luKFwiXCIpO1xuXG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9IGA8c2VsZWN0IGlkPVwiJHtpZH1cIiBjbGFzcz1cImZpbHRlci1pbnB1dFwiPiR7b3B0c308L3NlbGVjdD5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gXCJcIjtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAkKGAjJHtpZH1gKS5zZWxlY3RpemUoe1xuICAgICAgbWF4SXRlbXM6IDk5OTksXG4gICAgfSk7XG4gICAgJChgIyR7aWR9YClbMF0uc2VsZWN0aXplLnNldFZhbHVlKG51bGwpO1xuICAgICQoYCMke2lkfWApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgbGV0IHZhbCA9ICQoZXZlbnQudGFyZ2V0KS52YWwoKTtcbiAgICAgIGlmICh2YWwubGVuZ3RoID09IDApIHtcbiAgICAgICAgZGVsZXRlIHRoaXMudmFsdWVzW2RhdGEubmFtZV07XG4gICAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSB2YWw7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0RGF0ZShkYXRhKSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9IGA8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAgaW5wdXQtZGF0ZXJhbmdlIGZpbHRlci1pbnB1dFwiPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImRhdGVcIiBjbGFzcz1cImZvcm0tY29udHJvbCAke2lkfS1kYXRlXCIgdmFsdWU9XCIke2RhdGEubWlufVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtdGV4dFwiPnRvPC9kaXY+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiZGF0ZVwiIGNsYXNzPVwiZm9ybS1jb250cm9sICR7aWR9LWRhdGVcIiB2YWx1ZT1cIiR7ZGF0YS5tYXh9XCI+XG4gICAgICA8L2Rpdj5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFtkYXRhLm1pbiwgZGF0YS5tYXhdO1xuICAgIHRoaXMuI3NlbmQoKTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAkKGAuJHtpZH0tZGF0ZWApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgbGV0IHZhbHVlcyA9IFtdO1xuICAgICAgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoXCIuaW5wdXQtZ3JvdXBcIikuZmluZChcImlucHV0XCIpLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgIHZhbHVlcy5wdXNoKCQoZWwpLnZhbCgpKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IHZhbHVlcztcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRMb2dpY2FsKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxkaXYgY2xhc3M9XCJsb2dpY2FsLWZpbHRlclwiPlxuICAgICAgPGRpdiBjbGFzcz1cImZvcm0tY2hlY2sgZmlsdGVyLWlucHV0XCI+XG4gICAgICAgIDxpbnB1dCBjbGFzcz1cImZvcm0tY2hlY2staW5wdXQgJHtpZH0tbG9naWNhbFwiIHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImZvcm0tY2hlY2stbGFiZWxcIj5cbiAgICAgICAgICBUUlVFXG4gICAgICAgIDwvbGFiZWw+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmb3JtLWNoZWNrXCI+XG4gICAgICAgIDxpbnB1dCBjbGFzcz1cImZvcm0tY2hlY2staW5wdXQgJHtpZH0tbG9naWNhbFwiIHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImZvcm0tY2hlY2stbGFiZWxcIj5cbiAgICAgICAgICBGQUxTRVxuICAgICAgICA8L2xhYmVsPlxuICAgICAgPC9kaXY+XG4gICAgPGRpdj5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFt0cnVlLCBmYWxzZV07XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYC4ke2lkfS1sb2dpY2FsYCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgdmFsdWVzID0gW107XG4gICAgICAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChcIi5sb2dpY2FsLWZpbHRlclwiKS5maW5kKFwiaW5wdXRcIikuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgbGV0IHZhbCA9IHRydWU7XG4gICAgICAgIGlmIChpID09IDEpIHtcbiAgICAgICAgICB2YWwgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghJChlbCkuaXMoXCI6Y2hlY2tlZFwiKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbHVlcy5wdXNoKHZhbCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSB2YWx1ZXM7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cbn1cblxuJCgoKSA9PiB7XG4gIFNoaW55LmFkZEN1c3RvbU1lc3NhZ2VIYW5kbGVyKFwiZmxleGZpbHRlci1lbmRwb2ludHNcIiwgKG1zZykgPT4ge1xuICAgIGNvbnN0IGZpbHRlciA9IG5ldyBGaWx0ZXIobXNnKTtcbiAgICBmaWx0ZXIuaW5pdCgpO1xuICB9KTtcbn0pO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBcIi4vZmlsdGVyL2luZGV4LmpzXCI7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=