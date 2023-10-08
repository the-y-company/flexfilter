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
        groups = [...new Set(groups)];

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
        `<li><strong data-group="${group}" class="p-2 fw-bold">${group}</strong></li>`;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7V0FDQTtXQUNBO1dBQ0EsaUNBQWlDLFdBQVc7V0FDNUM7V0FDQTs7Ozs7V0NQQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBOzs7OztXQ1BBOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7Ozs7Ozs7QUNOMkIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mbGV4ZmlsdGVyLy4vc3JjanMvZmlsdGVyL2luZGV4LmpzIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2ZsZXhmaWx0ZXIvLi9zcmNqcy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBGaWx0ZXIge1xuICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgdGhpcy5wYXRoVmFyaWFibGVzID0gb3B0cy5wYXRoVmFyaWFibGVzO1xuICAgIHRoaXMucGF0aFZhcmlhYmxlID0gb3B0cy5wYXRoVmFyaWFibGU7XG4gICAgdGhpcy5ucyA9IG9wdHMubnM7XG4gICAgdGhpcy52YXJpYWJsZXNPbmx5ID0gb3B0cy52YXJpYWJsZXNPbmx5O1xuICAgIHRoaXMudGhyZXNob2xkID0gb3B0cy5zZWFyY2hUaHJlc2hvbGQ7XG4gICAgdGhpcy5ncm91cHMgPSBmYWxzZTtcblxuICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgdGhpcy5oYXNTZWFyY2ggPSBmYWxzZTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgZmV0Y2godGhpcy5wYXRoVmFyaWFibGVzKVxuICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGxldCBncm91cHMgPSBkYXRhLm1hcCgoZWwpID0+IGVsLmdyb3VwKTtcbiAgICAgICAgZ3JvdXBzID0gWy4uLm5ldyBTZXQoZ3JvdXBzKV07XG5cbiAgICAgICAgaWYgKCFncm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy4jdmFyaWFibGVJbnB1dChkYXRhKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyb3VwcyA9IHRydWU7XG4gICAgICAgIHRoaXMuI3ZhcmlhYmxlSW5wdXRHcm91cChkYXRhLCBncm91cHMpO1xuICAgICAgfSk7XG4gIH1cblxuICAjbWFrZUlkKCkge1xuICAgIHJldHVybiBcIl9cIiArIE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApO1xuICB9XG5cbiAgI2JpbmRSZW1vdmUoZGF0YSwgaWQpIHtcbiAgICAkKGAjJHtpZH0gLmZpbHRlci1yZW1vdmVgKS5vbihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoXCIuY2FyZFwiKS5yZW1vdmUoKTtcblxuICAgICAgaWYgKCF0aGlzLmdyb3Vwcykge1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5hcHBlbmQoXG4gICAgICAgICAgYDxsaT48YSBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHt0aGlzLm5zfS12YXJcIiBkYXRhLXZhbHVlPVwiJHtkYXRhLm5hbWV9XCI+JHtcbiAgICAgICAgICAgIGRhdGEubGFiZWwgfHwgZGF0YS5uYW1lXG4gICAgICAgICAgfTwvYT48L2xpPmAsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkKFxuICAgICAgICAgIGA8bGk+PGEgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7dGhpcy5uc30tdmFyXCIgZGF0YS12YWx1ZT1cIiR7ZGF0YS5uYW1lfVwiPiR7XG4gICAgICAgICAgICBkYXRhLmxhYmVsIHx8IGRhdGEubmFtZVxuICAgICAgICAgIH08L2E+PC9saT5gLFxuICAgICAgICApLmluc2VydEFmdGVyKFxuICAgICAgICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmZpbmQoYFtkYXRhLWdyb3VwPVwiJHtkYXRhLmdyb3VwfVwiXWApLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy4jYmluZFZhcmlhYmxlQWRkKCk7XG4gICAgICBkZWxldGUgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXTtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICN2YXJpYWJsZUlucHV0R3JvdXAoZGF0YSwgZ3JvdXBzKSB7XG4gICAgbGV0IG9wdHMgPSBncm91cHMubWFwKChncm91cCkgPT4ge1xuICAgICAgY29uc3QgaXRlbXMgPSBkYXRhLmZpbHRlcigoZWwpID0+IGVsLmdyb3VwID09IGdyb3VwKTtcblxuICAgICAgbGV0IGdyb3VwSXRlbSA9XG4gICAgICAgIGA8bGk+PHN0cm9uZyBkYXRhLWdyb3VwPVwiJHtncm91cH1cIiBjbGFzcz1cInAtMiBmdy1ib2xkXCI+JHtncm91cH08L3N0cm9uZz48L2xpPmA7XG5cbiAgICAgIGxldCBncm91cE9wdHMgPSBpdGVtcy5tYXAoKGVsKSA9PiB7XG4gICAgICAgIHJldHVybiBgPGxpPjxhIHN0eWxlPVwid2hpdGUtc3BhY2U6IHByZS13cmFwO2N1cnNvcjpwb2ludGVyO1wiIGNsYXNzPVwiZHJvcGRvd24taXRlbSAke3RoaXMubnN9LXZhclwiIGRhdGEtdmFsdWU9XCIke2VsLm5hbWV9XCI+JHtcbiAgICAgICAgICBlbC5sYWJlbCB8fCBlbC5uYW1lXG4gICAgICAgIH08L2E+PC9saT5gO1xuICAgICAgfSkuam9pbihcIlwiKTtcblxuICAgICAgcmV0dXJuIGdyb3VwSXRlbSArIGdyb3VwT3B0cztcbiAgICB9KS5qb2luKFwiXCIpO1xuXG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBpZiAoZGF0YS5sZW5ndGggPiB0aGlzLnRocmVzaG9sZCkge1xuICAgICAgdGhpcy5oYXNTZWFyY2ggPSB0cnVlO1xuICAgICAgb3B0cyA9XG4gICAgICAgIGA8bGk+PGlucHV0IGlkPVwiJHtpZH1cIiBwbGFjZWhvbGRlcj1cIlNlYXJjaFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgcC0yXCIgLz4ke29wdHN9PGxpPmA7XG4gICAgfVxuXG4gICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuaHRtbChcbiAgICAgIG9wdHMsXG4gICAgKTtcbiAgICB0aGlzLiNiaW5kVmFyaWFibGVBZGQoKTtcbiAgICB0aGlzLiNoYW5kbGVTZWFyY2goaWQpO1xuICB9XG5cbiAgI3ZhcmlhYmxlSW5wdXQoZGF0YSkge1xuICAgIGxldCBvcHRzID0gZGF0YS5tYXAoKGVsKSA9PiB7XG4gICAgICByZXR1cm4gYDxsaT48YSBzdHlsZT1cIndoaXRlLXNwYWNlOiBwcmUtd3JhcDtjdXJzb3I6cG9pbnRlcjtcIiBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHt0aGlzLm5zfS12YXJcIiBkYXRhLXZhbHVlPVwiJHtlbC5uYW1lfVwiPiR7XG4gICAgICAgIGVsLmxhYmVsIHx8IGVsLm5hbWVcbiAgICAgIH08L2E+PC9saT5gO1xuICAgIH0pLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGlmIChkYXRhLmxlbmd0aCA+IHRoaXMudGhyZXNob2xkKSB7XG4gICAgICB0aGlzLmhhc1NlYXJjaCA9IHRydWU7XG4gICAgICBvcHRzID1cbiAgICAgICAgYDxsaT48aW5wdXQgaWQ9XCIke2lkfVwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoXCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbCBkcm9wZG93bi1pdGVtXCIgLz4ke29wdHN9PGxpPmA7XG4gICAgfVxuXG4gICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuaHRtbChcbiAgICAgIG9wdHMsXG4gICAgKTtcbiAgICB0aGlzLiNiaW5kVmFyaWFibGVBZGQoKTtcbiAgICB0aGlzLiNoYW5kbGVTZWFyY2goaWQpO1xuICB9XG5cbiAgI2hhbmRsZVNlYXJjaChpZCkge1xuICAgIGlmICgkKGAjJHtpZH1gKS5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0O1xuXG4gICAgJChgIyR7aWR9YCkub24oXCJrZXl1cFwiLCAoZSkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gJChlLnRhcmdldCkudmFsKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5maW5kKFwiLmRyb3Bkb3duLWl0ZW1cIikuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHZhbHVlID0gJChlbCkuZGF0YShcInZhbHVlXCIpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICBpZiAodmFsdWUuaW5jbHVkZXMocXVlcnkpKSB7XG4gICAgICAgICAgICAkKGVsKS5zaG93KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHRleHQgPSAkKGVsKS50ZXh0KCk7XG5cbiAgICAgICAgICBpZiAodGV4dC5pbmNsdWRlcyhxdWVyeSkpIHtcbiAgICAgICAgICAgICQoZWwpLnNob3coKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAkKGVsKS5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSwgMjUwKTtcbiAgICB9KTtcbiAgfVxuXG4gICNiaW5kVmFyaWFibGVBZGQoKSB7XG4gICAgJChgLiR7dGhpcy5uc30tdmFyYCkub2ZmKCk7XG4gICAgJChgLiR7dGhpcy5uc30tdmFyYCkub24oXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgbGV0IHZhbHVlID0gJChlLnRhcmdldCkuZGF0YShcInZhbHVlXCIpO1xuXG4gICAgICAvLyByZW1vdmUgdmFyaWFibGUgZnJvbSBkcm9wZG93blxuICAgICAgJChlLnRhcmdldCkuY2xvc2VzdChcImxpXCIpLnJlbW92ZSgpO1xuXG4gICAgICBmZXRjaChgJHt0aGlzLnBhdGhWYXJpYWJsZX0mdmFyaWFibGU9JHtlbmNvZGVVUklDb21wb25lbnQodmFsdWUpfWApXG4gICAgICAgIC50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgdGhpcy4jaW5zZXJ0SW5wdXQoZGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5oYXNTZWFyY2gpIHtcbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuZmluZChcIi5kcm9wZG93bi1pdGVtXCIpLnZhbChcIlwiKTtcbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuZmluZChcIi5kcm9wZG93bi1pdGVtXCIpLnNob3coKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRJbnB1dChpbnB1dCkge1xuICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgY2FzZSBcIm51bWVyaWNcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0TnVtZXJpYyhpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImZhY3RvclwiOlxuICAgICAgICB0aGlzLiNpbnNlcnRGYWN0b3IoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJkYXRlXCI6XG4gICAgICAgIHRoaXMuI2luc2VydERhdGUoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJsb2dpY2FsXCI6XG4gICAgICAgIHRoaXMuI2luc2VydExvZ2ljYWwoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMuI2luc2VydENoYXJhY3RlcihpbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgI2FwcGVuZEZpbHRlcihkYXRhLCBjb250ZW50KSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBjYXJkID0gYDxkaXYgaWQ9JHtpZH0gZGF0YS1uYW1lPVwiJHtkYXRhLm5hbWV9XCIgY2xhc3M9XCJjYXJkIG1iLTFcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImQtZmxleFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LWdyb3ctMVwiPlxuICAgICAgICAgICAgJHtkYXRhLmxhYmVsIHx8IGRhdGEubmFtZX1cbiAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1tdXRlZCBwLTAgbS0wXCI+JHtkYXRhLmRlc2NyaXB0aW9uIHx8IFwiXCJ9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LXNocmluay0xXCI+XG4gICAgICAgICAgICA8YSBjbGFzcz1cImZsb2F0LXJpZ2h0IGZpbHRlci1yZW1vdmVcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIHRleHQtd2FybmluZ1wiPjwvaT48L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICAke3RoaXMudmFyaWFibGVzT25seSA/IFwiXCIgOiBjb250ZW50fVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICAkKGAjJHt0aGlzLm5zfS1maWx0ZXJzYCkuYXBwZW5kKGNhcmQpO1xuICAgIHRoaXMuI2JpbmRSZW1vdmUoZGF0YSwgaWQpO1xuICB9XG5cbiAgI3NlbmQoKSB7XG4gICAgU2hpbnkuc2V0SW5wdXRWYWx1ZShcbiAgICAgIGAke3RoaXMubnN9LXZhbHVlc2AsXG4gICAgICB0aGlzLnZhbHVlcyxcbiAgICApO1xuICB9XG5cbiAgI2luc2VydE51bWVyaWMoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPVxuICAgICAgYDxpbnB1dCBpZD1cIiR7aWR9XCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImpzLXJhbmdlLXNsaWRlciBmaWx0ZXItaW5wdXRcIiB2YWx1ZT1cIlwiIC8+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuICAgICQoYCMke2lkfWApXG4gICAgICAuaW9uUmFuZ2VTbGlkZXIoe1xuICAgICAgICBtaW46IGRhdGEubWluLFxuICAgICAgICBtYXg6IGRhdGEubWF4LFxuICAgICAgICBza2luOiBcInNoaW55XCIsXG4gICAgICAgIGdyaWQ6IHRydWUsXG4gICAgICAgIHN0ZXA6IGRhdGEuc3RlcCxcbiAgICAgICAgdHlwZTogXCJkb3VibGVcIixcbiAgICAgIH0pO1xuXG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFtkYXRhLm1pbiwgZGF0YS5tYXhdO1xuICAgIHRoaXMuI3NlbmQoKTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgdGltZW91dDtcbiAgICAkKGAjJHtpZH1gKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSAkKGV2ZW50LnRhcmdldCkudmFsKCkuc3BsaXQoXCI7XCIpLm1hcCgoZWwpID0+XG4gICAgICAgIHBhcnNlRmxvYXQoZWwpXG4gICAgICApO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICB9LCAyNTApO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydENoYXJhY3RlcihkYXRhKSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9XG4gICAgICBgPGlucHV0IGlkPVwiJHtpZH1cIiB2YWx1ZT1cIlwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgZmlsdGVyLWlucHV0XCIvPmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gXCJcIjtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQ7XG4gICAgJChgIyR7aWR9YCkub24oXCJrZXl1cFwiLCAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSAkKGV2ZW50LnRhcmdldCkudmFsKCk7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICAgIH0sIDI1MCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0RmFjdG9yKGRhdGEpIHtcbiAgICBjb25zdCBvcHRzID0gZGF0YS52YWx1ZXMubWFwKChlbCkgPT4ge1xuICAgICAgaWYgKGVsID09IFwibnVsbFwiKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuXG4gICAgICBpZiAoZWwgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBgPG9wdGlvbiB2YWx1ZT1cIiR7ZWx9XCI+JHtlbH08L29wdGlvbj5gO1xuICAgIH0pLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxzZWxlY3QgaWQ9XCIke2lkfVwiIGNsYXNzPVwiZmlsdGVyLWlucHV0XCI+JHtvcHRzfTwvc2VsZWN0PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBcIlwiO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYCMke2lkfWApLnNlbGVjdGl6ZSh7XG4gICAgICBtYXhJdGVtczogOTk5OSxcbiAgICB9KTtcbiAgICAkKGAjJHtpZH1gKVswXS5zZWxlY3RpemUuc2V0VmFsdWUobnVsbCk7XG4gICAgJChgIyR7aWR9YCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgdmFsID0gJChldmVudC50YXJnZXQpLnZhbCgpO1xuICAgICAgaWYgKHZhbC5sZW5ndGggPT0gMCkge1xuICAgICAgICBkZWxldGUgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXTtcbiAgICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgfVxuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IHZhbDtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnREYXRlKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cCBpbnB1dC1kYXRlcmFuZ2UgZmlsdGVyLWlucHV0XCI+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiZGF0ZVwiIGNsYXNzPVwiZm9ybS1jb250cm9sICR7aWR9LWRhdGVcIiB2YWx1ZT1cIiR7ZGF0YS5taW59XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC10ZXh0XCI+dG88L2Rpdj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJkYXRlXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgJHtpZH0tZGF0ZVwiIHZhbHVlPVwiJHtkYXRhLm1heH1cIj5cbiAgICAgIDwvZGl2PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gW2RhdGEubWluLCBkYXRhLm1heF07XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYC4ke2lkfS1kYXRlYCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgdmFsdWVzID0gW107XG4gICAgICAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChcIi5pbnB1dC1ncm91cFwiKS5maW5kKFwiaW5wdXRcIikuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgdmFsdWVzLnB1c2goJChlbCkudmFsKCkpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gdmFsdWVzO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydExvZ2ljYWwoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPGRpdiBjbGFzcz1cImxvZ2ljYWwtZmlsdGVyXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZm9ybS1jaGVjayBmaWx0ZXItaW5wdXRcIj5cbiAgICAgICAgPGlucHV0IGNsYXNzPVwiZm9ybS1jaGVjay1pbnB1dCAke2lkfS1sb2dpY2FsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwiZm9ybS1jaGVjay1sYWJlbFwiPlxuICAgICAgICAgIFRSVUVcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImZvcm0tY2hlY2tcIj5cbiAgICAgICAgPGlucHV0IGNsYXNzPVwiZm9ybS1jaGVjay1pbnB1dCAke2lkfS1sb2dpY2FsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwiZm9ybS1jaGVjay1sYWJlbFwiPlxuICAgICAgICAgIEZBTFNFXG4gICAgICAgIDwvbGFiZWw+XG4gICAgICA8L2Rpdj5cbiAgICA8ZGl2PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gW3RydWUsIGZhbHNlXTtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJChgLiR7aWR9LWxvZ2ljYWxgKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGxldCB2YWx1ZXMgPSBbXTtcbiAgICAgICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFwiLmxvZ2ljYWwtZmlsdGVyXCIpLmZpbmQoXCJpbnB1dFwiKS5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICBsZXQgdmFsID0gdHJ1ZTtcbiAgICAgICAgaWYgKGkgPT0gMSkge1xuICAgICAgICAgIHZhbCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEkKGVsKS5pcyhcIjpjaGVja2VkXCIpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFsdWVzLnB1c2godmFsKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IHZhbHVlcztcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxufVxuXG4kKCgpID0+IHtcbiAgU2hpbnkuYWRkQ3VzdG9tTWVzc2FnZUhhbmRsZXIoXCJmbGV4ZmlsdGVyLWVuZHBvaW50c1wiLCAobXNnKSA9PiB7XG4gICAgY29uc3QgZmlsdGVyID0gbmV3IEZpbHRlcihtc2cpO1xuICAgIGZpbHRlci5pbml0KCk7XG4gIH0pO1xufSk7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IFwiLi9maWx0ZXIvaW5kZXguanNcIjtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==