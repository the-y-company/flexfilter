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
            }-var" data-grp="${el.group}" data-value="${el.name}">${el.label || el.name}</a></li>`;
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
            let type = "group";

            if (!value) {
              type = "item";
              value = $(el).find("a").data("value");
            }

            if (!value) return;

            value = value.toLowerCase();

            if (value.includes(query)) {
              if (type == "item") {
                let group = $(el).find("a").data("grp");
                $(`[data-group='${group}']`).parent().show();
              }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0gsQ0FBQzs7Ozs7OztVQ3BaRDtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsaUNBQWlDLFdBQVc7V0FDNUM7V0FDQTs7Ozs7V0NQQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBOzs7OztXQ1BBOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7Ozs7Ozs7QUNOMkIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mbGV4ZmlsdGVyLy4vc3JjanMvZmlsdGVyL2luZGV4LmpzIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2ZsZXhmaWx0ZXIvLi9zcmNqcy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBGaWx0ZXIge1xuICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgdGhpcy5wYXRoVmFyaWFibGVzID0gb3B0cy5wYXRoVmFyaWFibGVzO1xuICAgIHRoaXMucGF0aFZhcmlhYmxlID0gb3B0cy5wYXRoVmFyaWFibGU7XG4gICAgdGhpcy5ucyA9IG9wdHMubnM7XG4gICAgdGhpcy52YXJpYWJsZXNPbmx5ID0gb3B0cy52YXJpYWJsZXNPbmx5O1xuICAgIHRoaXMudGhyZXNob2xkID0gb3B0cy5zZWFyY2hUaHJlc2hvbGQ7XG4gICAgdGhpcy5ncm91cHMgPSBmYWxzZTtcblxuICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgdGhpcy5oYXNTZWFyY2ggPSBmYWxzZTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgZmV0Y2godGhpcy5wYXRoVmFyaWFibGVzKVxuICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGxldCBncm91cHMgPSBkYXRhLm1hcCgoZWwpID0+IGVsLmdyb3VwKTtcbiAgICAgICAgZ3JvdXBzID0gWy4uLm5ldyBTZXQoZ3JvdXBzKV0uZmlsdGVyKChlbCkgPT4gZWwgIT0gbnVsbCk7XG5cbiAgICAgICAgaWYgKCFncm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy4jdmFyaWFibGVJbnB1dChkYXRhKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyb3VwcyA9IHRydWU7XG4gICAgICAgIHRoaXMuI3ZhcmlhYmxlSW5wdXRHcm91cChkYXRhLCBncm91cHMpO1xuICAgICAgfSk7XG4gIH1cblxuICAjbWFrZUlkKCkge1xuICAgIHJldHVybiBcIl9cIiArIE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApO1xuICB9XG5cbiAgI2JpbmRSZW1vdmUoZGF0YSwgaWQpIHtcbiAgICAkKGAjJHtpZH0gLmZpbHRlci1yZW1vdmVgKS5vbihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoXCIuY2FyZFwiKS5yZW1vdmUoKTtcblxuICAgICAgaWYgKCF0aGlzLmdyb3Vwcykge1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5hcHBlbmQoXG4gICAgICAgICAgYDxsaT48YSBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHt0aGlzLm5zfS12YXJcIiBkYXRhLXZhbHVlPVwiJHtcbiAgICAgICAgICAgIGRhdGEubmFtZVxuICAgICAgICAgIH1cIj4ke2RhdGEubGFiZWwgfHwgZGF0YS5uYW1lfTwvYT48L2xpPmAsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkKFxuICAgICAgICAgIGA8bGk+PGEgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7dGhpcy5uc30tdmFyXCIgZGF0YS12YWx1ZT1cIiR7XG4gICAgICAgICAgICBkYXRhLm5hbWVcbiAgICAgICAgICB9XCI+JHtkYXRhLmxhYmVsIHx8IGRhdGEubmFtZX08L2E+PC9saT5gLFxuICAgICAgICApLmluc2VydEFmdGVyKFxuICAgICAgICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApXG4gICAgICAgICAgICAuZmluZChgW2RhdGEtZ3JvdXA9XCIke2RhdGEuZ3JvdXB9XCJdYClcbiAgICAgICAgICAgIC5wYXJlbnQoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI2JpbmRWYXJpYWJsZUFkZCgpO1xuICAgICAgZGVsZXRlIHRoaXMudmFsdWVzW2RhdGEubmFtZV07XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICAjdmFyaWFibGVJbnB1dEdyb3VwKGRhdGEsIGdyb3Vwcykge1xuICAgIGxldCBvcHRzID0gZ3JvdXBzXG4gICAgICAubWFwKChncm91cCkgPT4ge1xuICAgICAgICBjb25zdCBpdGVtcyA9IGRhdGEuZmlsdGVyKChlbCkgPT4gZWwuZ3JvdXAgPT0gZ3JvdXApO1xuXG4gICAgICAgIGxldCBncm91cEl0ZW0gPSBgPGxpIGNsYXNzPVwicC0yXCI+PHN0cm9uZyBkYXRhLWdyb3VwPVwiJHtncm91cH1cIiBjbGFzcz1cImZ3LWJvbGRcIj4ke2dyb3VwfTwvc3Ryb25nPjwvbGk+YDtcblxuICAgICAgICBsZXQgZ3JvdXBPcHRzID0gaXRlbXNcbiAgICAgICAgICAubWFwKChlbCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGA8bGk+PGEgc3R5bGU9XCJ3aGl0ZS1zcGFjZTogcHJlLXdyYXA7Y3Vyc29yOnBvaW50ZXI7XCIgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7XG4gICAgICAgICAgICAgIHRoaXMubnNcbiAgICAgICAgICAgIH0tdmFyXCIgZGF0YS1ncnA9XCIke2VsLmdyb3VwfVwiIGRhdGEtdmFsdWU9XCIke2VsLm5hbWV9XCI+JHtlbC5sYWJlbCB8fCBlbC5uYW1lfTwvYT48L2xpPmA7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuam9pbihcIlwiKTtcblxuICAgICAgICByZXR1cm4gZ3JvdXBJdGVtICsgZ3JvdXBPcHRzO1xuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXCIpO1xuXG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBpZiAoZGF0YS5sZW5ndGggPiB0aGlzLnRocmVzaG9sZCkge1xuICAgICAgdGhpcy5oYXNTZWFyY2ggPSB0cnVlO1xuICAgICAgb3B0cyA9IGA8bGk+PGlucHV0IGlkPVwiJHtpZH1cIiBwbGFjZWhvbGRlcj1cIlNlYXJjaFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgcC0yXCIgLz4ke29wdHN9PGxpPmA7XG4gICAgfVxuXG4gICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuaHRtbChvcHRzKTtcbiAgICB0aGlzLiNiaW5kVmFyaWFibGVBZGQoKTtcbiAgICB0aGlzLiNoYW5kbGVTZWFyY2goaWQpO1xuICB9XG5cbiAgI3ZhcmlhYmxlSW5wdXQoZGF0YSkge1xuICAgIGxldCBvcHRzID0gZGF0YVxuICAgICAgLm1hcCgoZWwpID0+IHtcbiAgICAgICAgcmV0dXJuIGA8bGk+PGEgc3R5bGU9XCJ3aGl0ZS1zcGFjZTogcHJlLXdyYXA7Y3Vyc29yOnBvaW50ZXI7XCIgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7XG4gICAgICAgICAgdGhpcy5uc1xuICAgICAgICB9LXZhclwiIGRhdGEtdmFsdWU9XCIke2VsLm5hbWV9XCI+JHtlbC5sYWJlbCB8fCBlbC5uYW1lfTwvYT48L2xpPmA7XG4gICAgICB9KVxuICAgICAgLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGlmIChkYXRhLmxlbmd0aCA+IHRoaXMudGhyZXNob2xkKSB7XG4gICAgICB0aGlzLmhhc1NlYXJjaCA9IHRydWU7XG4gICAgICBvcHRzID0gYDxsaT48aW5wdXQgaWQ9XCIke2lkfVwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoXCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbCBkcm9wZG93bi1pdGVtXCIgLz4ke29wdHN9PGxpPmA7XG4gICAgfVxuXG4gICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuaHRtbChvcHRzKTtcbiAgICB0aGlzLiNiaW5kVmFyaWFibGVBZGQoKTtcbiAgICB0aGlzLiNoYW5kbGVTZWFyY2goaWQpO1xuICB9XG5cbiAgI2hhbmRsZVNlYXJjaChpZCkge1xuICAgIGlmICgkKGAjJHtpZH1gKS5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0O1xuXG4gICAgJChgIyR7aWR9YCkub2ZmKFwia2V5dXBcIik7XG4gICAgJChgIyR7aWR9YCkub24oXCJrZXl1cFwiLCAoZSkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gJChlLnRhcmdldCkudmFsKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKVxuICAgICAgICAgIC5maW5kKFwibGlcIilcbiAgICAgICAgICAuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICAgIGlmIChpID09IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSAkKGVsKS5maW5kKFwic3Ryb25nXCIpLmRhdGEoXCJncm91cFwiKTtcbiAgICAgICAgICAgIGxldCB0eXBlID0gXCJncm91cFwiO1xuXG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgIHR5cGUgPSBcIml0ZW1cIjtcbiAgICAgICAgICAgICAgdmFsdWUgPSAkKGVsKS5maW5kKFwiYVwiKS5kYXRhKFwidmFsdWVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUuaW5jbHVkZXMocXVlcnkpKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlID09IFwiaXRlbVwiKSB7XG4gICAgICAgICAgICAgICAgbGV0IGdyb3VwID0gJChlbCkuZmluZChcImFcIikuZGF0YShcImdycFwiKTtcbiAgICAgICAgICAgICAgICAkKGBbZGF0YS1ncm91cD0nJHtncm91cH0nXWApLnBhcmVudCgpLnNob3coKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAkKGVsKS5zaG93KCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHRleHQgPSAkKGVsKS50ZXh0KCk7XG5cbiAgICAgICAgICAgIGlmICh0ZXh0LmluY2x1ZGVzKHF1ZXJ5KSkge1xuICAgICAgICAgICAgICAkKGVsKS5zaG93KCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJChlbCkuaGlkZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSwgMjUwKTtcbiAgICB9KTtcbiAgfVxuXG4gICNiaW5kVmFyaWFibGVBZGQoKSB7XG4gICAgJChgLiR7dGhpcy5uc30tdmFyYCkub2ZmKCk7XG4gICAgJChgLiR7dGhpcy5uc30tdmFyYCkub24oXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgbGV0IHZhbHVlID0gJChlLnRhcmdldCkuZGF0YShcInZhbHVlXCIpO1xuXG4gICAgICAvLyByZW1vdmUgdmFyaWFibGUgZnJvbSBkcm9wZG93blxuICAgICAgJChlLnRhcmdldCkuY2xvc2VzdChcImxpXCIpLnJlbW92ZSgpO1xuXG4gICAgICBmZXRjaChgJHt0aGlzLnBhdGhWYXJpYWJsZX0mdmFyaWFibGU9JHtlbmNvZGVVUklDb21wb25lbnQodmFsdWUpfWApXG4gICAgICAgIC50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgdGhpcy4jaW5zZXJ0SW5wdXQoZGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5oYXNTZWFyY2gpIHtcbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuZmluZChcIi5kcm9wZG93bi1pdGVtXCIpLnZhbChcIlwiKTtcbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuZmluZChcIi5kcm9wZG93bi1pdGVtXCIpLnNob3coKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRJbnB1dChpbnB1dCkge1xuICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgY2FzZSBcIm51bWVyaWNcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0TnVtZXJpYyhpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImZhY3RvclwiOlxuICAgICAgICB0aGlzLiNpbnNlcnRGYWN0b3IoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJkYXRlXCI6XG4gICAgICAgIHRoaXMuI2luc2VydERhdGUoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJsb2dpY2FsXCI6XG4gICAgICAgIHRoaXMuI2luc2VydExvZ2ljYWwoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMuI2luc2VydENoYXJhY3RlcihpbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgI2FwcGVuZEZpbHRlcihkYXRhLCBjb250ZW50KSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBjYXJkID0gYDxkaXYgaWQ9JHtpZH0gZGF0YS1uYW1lPVwiJHtkYXRhLm5hbWV9XCIgY2xhc3M9XCJjYXJkIG1iLTFcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImQtZmxleFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LWdyb3ctMVwiPlxuICAgICAgICAgICAgJHtkYXRhLmxhYmVsIHx8IGRhdGEubmFtZX1cbiAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1tdXRlZCBwLTAgbS0wXCI+JHtkYXRhLmRlc2NyaXB0aW9uIHx8IFwiXCJ9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LXNocmluay0xXCI+XG4gICAgICAgICAgICA8YSBjbGFzcz1cImZsb2F0LXJpZ2h0IGZpbHRlci1yZW1vdmVcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIHRleHQtd2FybmluZ1wiPjwvaT48L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICAke3RoaXMudmFyaWFibGVzT25seSA/IFwiXCIgOiBjb250ZW50fVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICAkKGAjJHt0aGlzLm5zfS1maWx0ZXJzYCkuYXBwZW5kKGNhcmQpO1xuICAgIHRoaXMuI2JpbmRSZW1vdmUoZGF0YSwgaWQpO1xuICB9XG5cbiAgI3NlbmQoKSB7XG4gICAgU2hpbnkuc2V0SW5wdXRWYWx1ZShgJHt0aGlzLm5zfS12YWx1ZXNgLCB0aGlzLnZhbHVlcyk7XG4gIH1cblxuICAjaW5zZXJ0TnVtZXJpYyhkYXRhKSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9IGA8aW5wdXQgaWQ9XCIke2lkfVwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJqcy1yYW5nZS1zbGlkZXIgZmlsdGVyLWlucHV0XCIgdmFsdWU9XCJcIiAvPmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICAkKGAjJHtpZH1gKS5pb25SYW5nZVNsaWRlcih7XG4gICAgICBtaW46IGRhdGEubWluLFxuICAgICAgbWF4OiBkYXRhLm1heCxcbiAgICAgIHNraW46IFwic2hpbnlcIixcbiAgICAgIGdyaWQ6IHRydWUsXG4gICAgICBzdGVwOiBkYXRhLnN0ZXAsXG4gICAgICB0eXBlOiBcImRvdWJsZVwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFtkYXRhLm1pbiwgZGF0YS5tYXhdO1xuICAgIHRoaXMuI3NlbmQoKTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgdGltZW91dDtcbiAgICAkKGAjJHtpZH1gKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSAkKGV2ZW50LnRhcmdldClcbiAgICAgICAgLnZhbCgpXG4gICAgICAgIC5zcGxpdChcIjtcIilcbiAgICAgICAgLm1hcCgoZWwpID0+IHBhcnNlRmxvYXQoZWwpKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgfSwgMjUwKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRDaGFyYWN0ZXIoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPGlucHV0IGlkPVwiJHtpZH1cIiB2YWx1ZT1cIlwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgZmlsdGVyLWlucHV0XCIvPmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gXCJcIjtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQ7XG4gICAgJChgIyR7aWR9YCkub24oXCJrZXl1cFwiLCAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSAkKGV2ZW50LnRhcmdldCkudmFsKCk7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICAgIH0sIDI1MCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0RmFjdG9yKGRhdGEpIHtcbiAgICBjb25zdCBvcHRzID0gZGF0YS52YWx1ZXNcbiAgICAgIC5tYXAoKGVsKSA9PiB7XG4gICAgICAgIGlmIChlbCA9PSBcIm51bGxcIikge1xuICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYDxvcHRpb24gdmFsdWU9XCIke2VsfVwiPiR7ZWx9PC9vcHRpb24+YDtcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlwiKTtcblxuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPHNlbGVjdCBpZD1cIiR7aWR9XCIgY2xhc3M9XCJmaWx0ZXItaW5wdXRcIj4ke29wdHN9PC9zZWxlY3Q+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFwiXCI7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJChgIyR7aWR9YCkuc2VsZWN0aXplKHtcbiAgICAgIG1heEl0ZW1zOiA5OTk5LFxuICAgIH0pO1xuICAgICQoYCMke2lkfWApWzBdLnNlbGVjdGl6ZS5zZXRWYWx1ZShudWxsKTtcbiAgICAkKGAjJHtpZH1gKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGxldCB2YWwgPSAkKGV2ZW50LnRhcmdldCkudmFsKCk7XG4gICAgICBpZiAodmFsLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdO1xuICAgICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gdmFsO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydERhdGUoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwIGlucHV0LWRhdGVyYW5nZSBmaWx0ZXItaW5wdXRcIj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJkYXRlXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgJHtpZH0tZGF0ZVwiIHZhbHVlPVwiJHtkYXRhLm1pbn1cIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXRleHRcIj50bzwvZGl2PlxuICAgICAgICA8aW5wdXQgdHlwZT1cImRhdGVcIiBjbGFzcz1cImZvcm0tY29udHJvbCAke2lkfS1kYXRlXCIgdmFsdWU9XCIke2RhdGEubWF4fVwiPlxuICAgICAgPC9kaXY+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBbZGF0YS5taW4sIGRhdGEubWF4XTtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJChgLiR7aWR9LWRhdGVgKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGxldCB2YWx1ZXMgPSBbXTtcbiAgICAgICQoZXZlbnQudGFyZ2V0KVxuICAgICAgICAuY2xvc2VzdChcIi5pbnB1dC1ncm91cFwiKVxuICAgICAgICAuZmluZChcImlucHV0XCIpXG4gICAgICAgIC5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICAgIHZhbHVlcy5wdXNoKCQoZWwpLnZhbCgpKTtcbiAgICAgICAgfSk7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gdmFsdWVzO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydExvZ2ljYWwoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPGRpdiBjbGFzcz1cImxvZ2ljYWwtZmlsdGVyXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZm9ybS1jaGVjayBmaWx0ZXItaW5wdXRcIj5cbiAgICAgICAgPGlucHV0IGNsYXNzPVwiZm9ybS1jaGVjay1pbnB1dCAke2lkfS1sb2dpY2FsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwiZm9ybS1jaGVjay1sYWJlbFwiPlxuICAgICAgICAgIFRSVUVcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImZvcm0tY2hlY2tcIj5cbiAgICAgICAgPGlucHV0IGNsYXNzPVwiZm9ybS1jaGVjay1pbnB1dCAke2lkfS1sb2dpY2FsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwiZm9ybS1jaGVjay1sYWJlbFwiPlxuICAgICAgICAgIEZBTFNFXG4gICAgICAgIDwvbGFiZWw+XG4gICAgICA8L2Rpdj5cbiAgICA8ZGl2PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gW3RydWUsIGZhbHNlXTtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJChgLiR7aWR9LWxvZ2ljYWxgKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGxldCB2YWx1ZXMgPSBbXTtcbiAgICAgICQoZXZlbnQudGFyZ2V0KVxuICAgICAgICAuY2xvc2VzdChcIi5sb2dpY2FsLWZpbHRlclwiKVxuICAgICAgICAuZmluZChcImlucHV0XCIpXG4gICAgICAgIC5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICAgIGxldCB2YWwgPSB0cnVlO1xuICAgICAgICAgIGlmIChpID09IDEpIHtcbiAgICAgICAgICAgIHZhbCA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghJChlbCkuaXMoXCI6Y2hlY2tlZFwiKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbCk7XG4gICAgICAgIH0pO1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IHZhbHVlcztcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxufVxuXG4kKCgpID0+IHtcbiAgU2hpbnkuYWRkQ3VzdG9tTWVzc2FnZUhhbmRsZXIoXCJmbGV4ZmlsdGVyLWVuZHBvaW50c1wiLCAobXNnKSA9PiB7XG4gICAgY29uc3QgZmlsdGVyID0gbmV3IEZpbHRlcihtc2cpO1xuICAgIGZpbHRlci5pbml0KCk7XG4gIH0pO1xufSk7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IFwiLi9maWx0ZXIvaW5kZXguanNcIjtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==