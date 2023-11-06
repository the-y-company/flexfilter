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
            }-var" data-grp="${el.group}" data-value="${el.name}">${
              el.label || el.name
            }</a></li>`;
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

        let lastGroupFound = "";
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

            if (type == "item") {
              let group = $(el).find("a").data("grp");
              if (group.toLowerCase() == lastGroupFound) {
                $(`[data-group='${group}']`).parent().show();
                $(el).show();
                return;
              }
            }

            if (value.includes(query)) {
              if (type == "item") {
                let group = $(el).find("a").data("grp");
                $(`[data-group='${group}']`).parent().show();
              }
              if (type == "group") lastGroupFound = value;

              $(el).show();
              return;
            }

            let text = $(el).text();

            if (text.includes(query)) {
              if (type == "item") {
                let group = $(el).find("a").data("grp");
                $(`[data-group='${group}']`).parent().show();
              }
              if (type == "group") lastGroupFound = value;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDOzs7Ozs7O1VDeGFEO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxpQ0FBaUMsV0FBVztXQUM1QztXQUNBOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7OztBQ04yQiIsInNvdXJjZXMiOlsid2VicGFjazovL2ZsZXhmaWx0ZXIvLi9zcmNqcy9maWx0ZXIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci8uL3NyY2pzL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNsYXNzIEZpbHRlciB7XG4gIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICB0aGlzLnBhdGhWYXJpYWJsZXMgPSBvcHRzLnBhdGhWYXJpYWJsZXM7XG4gICAgdGhpcy5wYXRoVmFyaWFibGUgPSBvcHRzLnBhdGhWYXJpYWJsZTtcbiAgICB0aGlzLm5zID0gb3B0cy5ucztcbiAgICB0aGlzLnZhcmlhYmxlc09ubHkgPSBvcHRzLnZhcmlhYmxlc09ubHk7XG4gICAgdGhpcy50aHJlc2hvbGQgPSBvcHRzLnNlYXJjaFRocmVzaG9sZDtcbiAgICB0aGlzLmdyb3VwcyA9IGZhbHNlO1xuXG4gICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB0aGlzLmhhc1NlYXJjaCA9IGZhbHNlO1xuICB9XG5cbiAgaW5pdCgpIHtcbiAgICBmZXRjaCh0aGlzLnBhdGhWYXJpYWJsZXMpXG4gICAgICAudGhlbigocmVzKSA9PiByZXMuanNvbigpKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgbGV0IGdyb3VwcyA9IGRhdGEubWFwKChlbCkgPT4gZWwuZ3JvdXApO1xuICAgICAgICBncm91cHMgPSBbLi4ubmV3IFNldChncm91cHMpXS5maWx0ZXIoKGVsKSA9PiBlbCAhPSBudWxsKTtcblxuICAgICAgICBpZiAoIWdyb3Vwcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLiN2YXJpYWJsZUlucHV0KGRhdGEpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ3JvdXBzID0gdHJ1ZTtcbiAgICAgICAgdGhpcy4jdmFyaWFibGVJbnB1dEdyb3VwKGRhdGEsIGdyb3Vwcyk7XG4gICAgICB9KTtcbiAgfVxuXG4gICNtYWtlSWQoKSB7XG4gICAgcmV0dXJuIFwiX1wiICsgTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMCk7XG4gIH1cblxuICAjYmluZFJlbW92ZShkYXRhLCBpZCkge1xuICAgICQoYCMke2lkfSAuZmlsdGVyLXJlbW92ZWApLm9uKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChcIi5jYXJkXCIpLnJlbW92ZSgpO1xuXG4gICAgICBpZiAoIXRoaXMuZ3JvdXBzKSB7XG4gICAgICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmFwcGVuZChcbiAgICAgICAgICBgPGxpPjxhIGNsYXNzPVwiZHJvcGRvd24taXRlbSAke3RoaXMubnN9LXZhclwiIGRhdGEtdmFsdWU9XCIke1xuICAgICAgICAgICAgZGF0YS5uYW1lXG4gICAgICAgICAgfVwiPiR7ZGF0YS5sYWJlbCB8fCBkYXRhLm5hbWV9PC9hPjwvbGk+YCxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICQoXG4gICAgICAgICAgYDxsaT48YSBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHt0aGlzLm5zfS12YXJcIiBkYXRhLXZhbHVlPVwiJHtcbiAgICAgICAgICAgIGRhdGEubmFtZVxuICAgICAgICAgIH1cIj4ke2RhdGEubGFiZWwgfHwgZGF0YS5uYW1lfTwvYT48L2xpPmAsXG4gICAgICAgICkuaW5zZXJ0QWZ0ZXIoXG4gICAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYClcbiAgICAgICAgICAgIC5maW5kKGBbZGF0YS1ncm91cD1cIiR7ZGF0YS5ncm91cH1cIl1gKVxuICAgICAgICAgICAgLnBhcmVudCgpLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy4jYmluZFZhcmlhYmxlQWRkKCk7XG4gICAgICBkZWxldGUgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXTtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICN2YXJpYWJsZUlucHV0R3JvdXAoZGF0YSwgZ3JvdXBzKSB7XG4gICAgbGV0IG9wdHMgPSBncm91cHNcbiAgICAgIC5tYXAoKGdyb3VwKSA9PiB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gZGF0YS5maWx0ZXIoKGVsKSA9PiBlbC5ncm91cCA9PSBncm91cCk7XG5cbiAgICAgICAgbGV0IGdyb3VwSXRlbSA9IGA8bGkgY2xhc3M9XCJwLTJcIj48c3Ryb25nIGRhdGEtZ3JvdXA9XCIke2dyb3VwfVwiIGNsYXNzPVwiZnctYm9sZFwiPiR7Z3JvdXB9PC9zdHJvbmc+PC9saT5gO1xuXG4gICAgICAgIGxldCBncm91cE9wdHMgPSBpdGVtc1xuICAgICAgICAgIC5tYXAoKGVsKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYDxsaT48YSBzdHlsZT1cIndoaXRlLXNwYWNlOiBwcmUtd3JhcDtjdXJzb3I6cG9pbnRlcjtcIiBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHtcbiAgICAgICAgICAgICAgdGhpcy5uc1xuICAgICAgICAgICAgfS12YXJcIiBkYXRhLWdycD1cIiR7ZWwuZ3JvdXB9XCIgZGF0YS12YWx1ZT1cIiR7ZWwubmFtZX1cIj4ke1xuICAgICAgICAgICAgICBlbC5sYWJlbCB8fCBlbC5uYW1lXG4gICAgICAgICAgICB9PC9hPjwvbGk+YDtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5qb2luKFwiXCIpO1xuXG4gICAgICAgIHJldHVybiBncm91cEl0ZW0gKyBncm91cE9wdHM7XG4gICAgICB9KVxuICAgICAgLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGlmIChkYXRhLmxlbmd0aCA+IHRoaXMudGhyZXNob2xkKSB7XG4gICAgICB0aGlzLmhhc1NlYXJjaCA9IHRydWU7XG4gICAgICBvcHRzID0gYDxsaT48aW5wdXQgaWQ9XCIke2lkfVwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoXCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbCBwLTJcIiAvPiR7b3B0c308bGk+YDtcbiAgICB9XG5cbiAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5odG1sKG9wdHMpO1xuICAgIHRoaXMuI2JpbmRWYXJpYWJsZUFkZCgpO1xuICAgIHRoaXMuI2hhbmRsZVNlYXJjaChpZCk7XG4gIH1cblxuICAjdmFyaWFibGVJbnB1dChkYXRhKSB7XG4gICAgbGV0IG9wdHMgPSBkYXRhXG4gICAgICAubWFwKChlbCkgPT4ge1xuICAgICAgICByZXR1cm4gYDxsaT48YSBzdHlsZT1cIndoaXRlLXNwYWNlOiBwcmUtd3JhcDtjdXJzb3I6cG9pbnRlcjtcIiBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHtcbiAgICAgICAgICB0aGlzLm5zXG4gICAgICAgIH0tdmFyXCIgZGF0YS12YWx1ZT1cIiR7ZWwubmFtZX1cIj4ke2VsLmxhYmVsIHx8IGVsLm5hbWV9PC9hPjwvbGk+YDtcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlwiKTtcblxuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgaWYgKGRhdGEubGVuZ3RoID4gdGhpcy50aHJlc2hvbGQpIHtcbiAgICAgIHRoaXMuaGFzU2VhcmNoID0gdHJ1ZTtcbiAgICAgIG9wdHMgPSBgPGxpPjxpbnB1dCBpZD1cIiR7aWR9XCIgcGxhY2Vob2xkZXI9XCJTZWFyY2hcIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIGRyb3Bkb3duLWl0ZW1cIiAvPiR7b3B0c308bGk+YDtcbiAgICB9XG5cbiAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5odG1sKG9wdHMpO1xuICAgIHRoaXMuI2JpbmRWYXJpYWJsZUFkZCgpO1xuICAgIHRoaXMuI2hhbmRsZVNlYXJjaChpZCk7XG4gIH1cblxuICAjaGFuZGxlU2VhcmNoKGlkKSB7XG4gICAgaWYgKCQoYCMke2lkfWApLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQ7XG5cbiAgICAkKGAjJHtpZH1gKS5vZmYoXCJrZXl1cFwiKTtcbiAgICAkKGAjJHtpZH1gKS5vbihcImtleXVwXCIsIChlKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBsZXQgcXVlcnkgPSAkKGUudGFyZ2V0KS52YWwoKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGxldCBsYXN0R3JvdXBGb3VuZCA9IFwiXCI7XG4gICAgICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApXG4gICAgICAgICAgLmZpbmQoXCJsaVwiKVxuICAgICAgICAgIC5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICAgICAgaWYgKGkgPT0gMCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCB2YWx1ZSA9ICQoZWwpLmZpbmQoXCJzdHJvbmdcIikuZGF0YShcImdyb3VwXCIpO1xuICAgICAgICAgICAgbGV0IHR5cGUgPSBcImdyb3VwXCI7XG5cbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgdHlwZSA9IFwiaXRlbVwiO1xuICAgICAgICAgICAgICB2YWx1ZSA9ICQoZWwpLmZpbmQoXCJhXCIpLmRhdGEoXCJ2YWx1ZVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiaXRlbVwiKSB7XG4gICAgICAgICAgICAgIGxldCBncm91cCA9ICQoZWwpLmZpbmQoXCJhXCIpLmRhdGEoXCJncnBcIik7XG4gICAgICAgICAgICAgIGlmIChncm91cC50b0xvd2VyQ2FzZSgpID09IGxhc3RHcm91cEZvdW5kKSB7XG4gICAgICAgICAgICAgICAgJChgW2RhdGEtZ3JvdXA9JyR7Z3JvdXB9J11gKS5wYXJlbnQoKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgJChlbCkuc2hvdygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodmFsdWUuaW5jbHVkZXMocXVlcnkpKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlID09IFwiaXRlbVwiKSB7XG4gICAgICAgICAgICAgICAgbGV0IGdyb3VwID0gJChlbCkuZmluZChcImFcIikuZGF0YShcImdycFwiKTtcbiAgICAgICAgICAgICAgICAkKGBbZGF0YS1ncm91cD0nJHtncm91cH0nXWApLnBhcmVudCgpLnNob3coKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodHlwZSA9PSBcImdyb3VwXCIpIGxhc3RHcm91cEZvdW5kID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgJChlbCkuc2hvdygpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCB0ZXh0ID0gJChlbCkudGV4dCgpO1xuXG4gICAgICAgICAgICBpZiAodGV4dC5pbmNsdWRlcyhxdWVyeSkpIHtcbiAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJpdGVtXCIpIHtcbiAgICAgICAgICAgICAgICBsZXQgZ3JvdXAgPSAkKGVsKS5maW5kKFwiYVwiKS5kYXRhKFwiZ3JwXCIpO1xuICAgICAgICAgICAgICAgICQoYFtkYXRhLWdyb3VwPScke2dyb3VwfSddYCkucGFyZW50KCkuc2hvdygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICh0eXBlID09IFwiZ3JvdXBcIikgbGFzdEdyb3VwRm91bmQgPSB2YWx1ZTtcblxuICAgICAgICAgICAgICAkKGVsKS5zaG93KCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJChlbCkuaGlkZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSwgMjUwKTtcbiAgICB9KTtcbiAgfVxuXG4gICNiaW5kVmFyaWFibGVBZGQoKSB7XG4gICAgJChgLiR7dGhpcy5uc30tdmFyYCkub2ZmKCk7XG4gICAgJChgLiR7dGhpcy5uc30tdmFyYCkub24oXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgbGV0IHZhbHVlID0gJChlLnRhcmdldCkuZGF0YShcInZhbHVlXCIpO1xuXG4gICAgICAvLyByZW1vdmUgdmFyaWFibGUgZnJvbSBkcm9wZG93blxuICAgICAgJChlLnRhcmdldCkuY2xvc2VzdChcImxpXCIpLnJlbW92ZSgpO1xuXG4gICAgICBmZXRjaChgJHt0aGlzLnBhdGhWYXJpYWJsZX0mdmFyaWFibGU9JHtlbmNvZGVVUklDb21wb25lbnQodmFsdWUpfWApXG4gICAgICAgIC50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpXG4gICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgdGhpcy4jaW5zZXJ0SW5wdXQoZGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5oYXNTZWFyY2gpIHtcbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuZmluZChcIi5kcm9wZG93bi1pdGVtXCIpLnZhbChcIlwiKTtcbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuZmluZChcIi5kcm9wZG93bi1pdGVtXCIpLnNob3coKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRJbnB1dChpbnB1dCkge1xuICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgY2FzZSBcIm51bWVyaWNcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0TnVtZXJpYyhpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImZhY3RvclwiOlxuICAgICAgICB0aGlzLiNpbnNlcnRGYWN0b3IoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJkYXRlXCI6XG4gICAgICAgIHRoaXMuI2luc2VydERhdGUoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJsb2dpY2FsXCI6XG4gICAgICAgIHRoaXMuI2luc2VydExvZ2ljYWwoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMuI2luc2VydENoYXJhY3RlcihpbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgI2FwcGVuZEZpbHRlcihkYXRhLCBjb250ZW50KSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBjYXJkID0gYDxkaXYgaWQ9JHtpZH0gZGF0YS1uYW1lPVwiJHtkYXRhLm5hbWV9XCIgY2xhc3M9XCJjYXJkIG1iLTFcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImQtZmxleFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LWdyb3ctMVwiPlxuICAgICAgICAgICAgJHtkYXRhLmxhYmVsIHx8IGRhdGEubmFtZX1cbiAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1tdXRlZCBwLTAgbS0wXCI+JHtkYXRhLmRlc2NyaXB0aW9uIHx8IFwiXCJ9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LXNocmluay0xXCI+XG4gICAgICAgICAgICA8YSBjbGFzcz1cImZsb2F0LXJpZ2h0IGZpbHRlci1yZW1vdmVcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIHRleHQtd2FybmluZ1wiPjwvaT48L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICAke3RoaXMudmFyaWFibGVzT25seSA/IFwiXCIgOiBjb250ZW50fVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICAkKGAjJHt0aGlzLm5zfS1maWx0ZXJzYCkuYXBwZW5kKGNhcmQpO1xuICAgIHRoaXMuI2JpbmRSZW1vdmUoZGF0YSwgaWQpO1xuICB9XG5cbiAgI3NlbmQoKSB7XG4gICAgU2hpbnkuc2V0SW5wdXRWYWx1ZShgJHt0aGlzLm5zfS12YWx1ZXNgLCB0aGlzLnZhbHVlcyk7XG4gIH1cblxuICAjaW5zZXJ0TnVtZXJpYyhkYXRhKSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9IGA8aW5wdXQgaWQ9XCIke2lkfVwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJqcy1yYW5nZS1zbGlkZXIgZmlsdGVyLWlucHV0XCIgdmFsdWU9XCJcIiAvPmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICAkKGAjJHtpZH1gKS5pb25SYW5nZVNsaWRlcih7XG4gICAgICBtaW46IGRhdGEubWluLFxuICAgICAgbWF4OiBkYXRhLm1heCxcbiAgICAgIHNraW46IFwic2hpbnlcIixcbiAgICAgIGdyaWQ6IHRydWUsXG4gICAgICBzdGVwOiBkYXRhLnN0ZXAsXG4gICAgICB0eXBlOiBcImRvdWJsZVwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFtkYXRhLm1pbiwgZGF0YS5tYXhdO1xuICAgIHRoaXMuI3NlbmQoKTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgdGltZW91dDtcbiAgICAkKGAjJHtpZH1gKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSAkKGV2ZW50LnRhcmdldClcbiAgICAgICAgLnZhbCgpXG4gICAgICAgIC5zcGxpdChcIjtcIilcbiAgICAgICAgLm1hcCgoZWwpID0+IHBhcnNlRmxvYXQoZWwpKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgfSwgMjUwKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRDaGFyYWN0ZXIoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPGlucHV0IGlkPVwiJHtpZH1cIiB2YWx1ZT1cIlwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgZmlsdGVyLWlucHV0XCIvPmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gXCJcIjtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQ7XG4gICAgJChgIyR7aWR9YCkub24oXCJrZXl1cFwiLCAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSAkKGV2ZW50LnRhcmdldCkudmFsKCk7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICAgIH0sIDI1MCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0RmFjdG9yKGRhdGEpIHtcbiAgICBjb25zdCBvcHRzID0gZGF0YS52YWx1ZXNcbiAgICAgIC5tYXAoKGVsKSA9PiB7XG4gICAgICAgIGlmIChlbCA9PSBcIm51bGxcIikge1xuICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYDxvcHRpb24gdmFsdWU9XCIke2VsfVwiPiR7ZWx9PC9vcHRpb24+YDtcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlwiKTtcblxuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPHNlbGVjdCBpZD1cIiR7aWR9XCIgY2xhc3M9XCJmaWx0ZXItaW5wdXRcIj4ke29wdHN9PC9zZWxlY3Q+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFwiXCI7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJChgIyR7aWR9YCkuc2VsZWN0aXplKHtcbiAgICAgIG1heEl0ZW1zOiA5OTk5LFxuICAgIH0pO1xuICAgICQoYCMke2lkfWApWzBdLnNlbGVjdGl6ZS5zZXRWYWx1ZShudWxsKTtcbiAgICAkKGAjJHtpZH1gKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGxldCB2YWwgPSAkKGV2ZW50LnRhcmdldCkudmFsKCk7XG4gICAgICBpZiAodmFsLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdO1xuICAgICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gdmFsO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydERhdGUoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwIGlucHV0LWRhdGVyYW5nZSBmaWx0ZXItaW5wdXRcIj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJkYXRlXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgJHtpZH0tZGF0ZVwiIHZhbHVlPVwiJHtkYXRhLm1pbn1cIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXRleHRcIj50bzwvZGl2PlxuICAgICAgICA8aW5wdXQgdHlwZT1cImRhdGVcIiBjbGFzcz1cImZvcm0tY29udHJvbCAke2lkfS1kYXRlXCIgdmFsdWU9XCIke2RhdGEubWF4fVwiPlxuICAgICAgPC9kaXY+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBbZGF0YS5taW4sIGRhdGEubWF4XTtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJChgLiR7aWR9LWRhdGVgKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGxldCB2YWx1ZXMgPSBbXTtcbiAgICAgICQoZXZlbnQudGFyZ2V0KVxuICAgICAgICAuY2xvc2VzdChcIi5pbnB1dC1ncm91cFwiKVxuICAgICAgICAuZmluZChcImlucHV0XCIpXG4gICAgICAgIC5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICAgIHZhbHVlcy5wdXNoKCQoZWwpLnZhbCgpKTtcbiAgICAgICAgfSk7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gdmFsdWVzO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydExvZ2ljYWwoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPGRpdiBjbGFzcz1cImxvZ2ljYWwtZmlsdGVyXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZm9ybS1jaGVjayBmaWx0ZXItaW5wdXRcIj5cbiAgICAgICAgPGlucHV0IGNsYXNzPVwiZm9ybS1jaGVjay1pbnB1dCAke2lkfS1sb2dpY2FsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwiZm9ybS1jaGVjay1sYWJlbFwiPlxuICAgICAgICAgIFRSVUVcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImZvcm0tY2hlY2tcIj5cbiAgICAgICAgPGlucHV0IGNsYXNzPVwiZm9ybS1jaGVjay1pbnB1dCAke2lkfS1sb2dpY2FsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwiZm9ybS1jaGVjay1sYWJlbFwiPlxuICAgICAgICAgIEZBTFNFXG4gICAgICAgIDwvbGFiZWw+XG4gICAgICA8L2Rpdj5cbiAgICA8ZGl2PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gW3RydWUsIGZhbHNlXTtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJChgLiR7aWR9LWxvZ2ljYWxgKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGxldCB2YWx1ZXMgPSBbXTtcbiAgICAgICQoZXZlbnQudGFyZ2V0KVxuICAgICAgICAuY2xvc2VzdChcIi5sb2dpY2FsLWZpbHRlclwiKVxuICAgICAgICAuZmluZChcImlucHV0XCIpXG4gICAgICAgIC5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICAgIGxldCB2YWwgPSB0cnVlO1xuICAgICAgICAgIGlmIChpID09IDEpIHtcbiAgICAgICAgICAgIHZhbCA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghJChlbCkuaXMoXCI6Y2hlY2tlZFwiKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbCk7XG4gICAgICAgIH0pO1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IHZhbHVlcztcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxufVxuXG4kKCgpID0+IHtcbiAgU2hpbnkuYWRkQ3VzdG9tTWVzc2FnZUhhbmRsZXIoXCJmbGV4ZmlsdGVyLWVuZHBvaW50c1wiLCAobXNnKSA9PiB7XG4gICAgY29uc3QgZmlsdGVyID0gbmV3IEZpbHRlcihtc2cpO1xuICAgIGZpbHRlci5pbml0KCk7XG4gIH0pO1xufSk7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IFwiLi9maWx0ZXIvaW5kZXguanNcIjtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==