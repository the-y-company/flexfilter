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
          `<li><a style="white-space: pre-wrap;cursor:pointer;" class="dropdown-item ${
            this.ns
          }-var" data-value="${data.name}">${data.label || data.name}</a></li>`,
        );
      } else {
        $(
          `<li><a style="white-space: pre-wrap;cursor:pointer;" class="dropdown-item ${
            this.ns
          }-var" data-grp="${data.group}" data-value="${data.name}">${
            data.label || data.name
          }</a></li>`,
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
    const card = `<div id=${id} data-group="${data.group}" data-name="${
      data.name
    }" class="card mb-1">
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
    window.Shiny.setInputValue(`${this.ns}-values`, this.values);
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
  window.Shiny.addCustomMessageHandler("flexfilter-endpoints", (msg) => {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTs7QUFFQSxVQUFVLEdBQUc7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDOzs7Ozs7O1VDNWFEO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxpQ0FBaUMsV0FBVztXQUM1QztXQUNBOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7OztBQ04yQiIsInNvdXJjZXMiOlsid2VicGFjazovL2ZsZXhmaWx0ZXIvLi9zcmNqcy9maWx0ZXIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci8uL3NyY2pzL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNsYXNzIEZpbHRlciB7XG4gIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICB0aGlzLnBhdGhWYXJpYWJsZXMgPSBvcHRzLnBhdGhWYXJpYWJsZXM7XG4gICAgdGhpcy5wYXRoVmFyaWFibGUgPSBvcHRzLnBhdGhWYXJpYWJsZTtcbiAgICB0aGlzLm5zID0gb3B0cy5ucztcbiAgICB0aGlzLnZhcmlhYmxlc09ubHkgPSBvcHRzLnZhcmlhYmxlc09ubHk7XG4gICAgdGhpcy50aHJlc2hvbGQgPSBvcHRzLnNlYXJjaFRocmVzaG9sZDtcbiAgICB0aGlzLmdyb3VwcyA9IGZhbHNlO1xuXG4gICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB0aGlzLmhhc1NlYXJjaCA9IGZhbHNlO1xuICB9XG5cbiAgaW5pdCgpIHtcbiAgICBmZXRjaCh0aGlzLnBhdGhWYXJpYWJsZXMpXG4gICAgICAudGhlbigocmVzKSA9PiByZXMuanNvbigpKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgbGV0IGdyb3VwcyA9IGRhdGEubWFwKChlbCkgPT4gZWwuZ3JvdXApO1xuICAgICAgICBncm91cHMgPSBbLi4ubmV3IFNldChncm91cHMpXS5maWx0ZXIoKGVsKSA9PiBlbCAhPSBudWxsKTtcblxuICAgICAgICBpZiAoIWdyb3Vwcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLiN2YXJpYWJsZUlucHV0KGRhdGEpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ3JvdXBzID0gdHJ1ZTtcbiAgICAgICAgdGhpcy4jdmFyaWFibGVJbnB1dEdyb3VwKGRhdGEsIGdyb3Vwcyk7XG4gICAgICB9KTtcbiAgfVxuXG4gICNtYWtlSWQoKSB7XG4gICAgcmV0dXJuIFwiX1wiICsgTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMCk7XG4gIH1cblxuICAjYmluZFJlbW92ZShkYXRhLCBpZCkge1xuICAgICQoYCMke2lkfSAuZmlsdGVyLXJlbW92ZWApLm9uKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChcIi5jYXJkXCIpLnJlbW92ZSgpO1xuXG4gICAgICBpZiAoIXRoaXMuZ3JvdXBzKSB7XG4gICAgICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmFwcGVuZChcbiAgICAgICAgICBgPGxpPjxhIHN0eWxlPVwid2hpdGUtc3BhY2U6IHByZS13cmFwO2N1cnNvcjpwb2ludGVyO1wiIGNsYXNzPVwiZHJvcGRvd24taXRlbSAke1xuICAgICAgICAgICAgdGhpcy5uc1xuICAgICAgICAgIH0tdmFyXCIgZGF0YS12YWx1ZT1cIiR7ZGF0YS5uYW1lfVwiPiR7ZGF0YS5sYWJlbCB8fCBkYXRhLm5hbWV9PC9hPjwvbGk+YCxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICQoXG4gICAgICAgICAgYDxsaT48YSBzdHlsZT1cIndoaXRlLXNwYWNlOiBwcmUtd3JhcDtjdXJzb3I6cG9pbnRlcjtcIiBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHtcbiAgICAgICAgICAgIHRoaXMubnNcbiAgICAgICAgICB9LXZhclwiIGRhdGEtZ3JwPVwiJHtkYXRhLmdyb3VwfVwiIGRhdGEtdmFsdWU9XCIke2RhdGEubmFtZX1cIj4ke1xuICAgICAgICAgICAgZGF0YS5sYWJlbCB8fCBkYXRhLm5hbWVcbiAgICAgICAgICB9PC9hPjwvbGk+YCxcbiAgICAgICAgKS5pbnNlcnRBZnRlcihcbiAgICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKVxuICAgICAgICAgICAgLmZpbmQoYFtkYXRhLWdyb3VwPVwiJHtkYXRhLmdyb3VwfVwiXWApXG4gICAgICAgICAgICAucGFyZW50KCksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICB0aGlzLiNiaW5kVmFyaWFibGVBZGQoKTtcbiAgICAgIGRlbGV0ZSB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgIH0pO1xuICB9XG5cbiAgI3ZhcmlhYmxlSW5wdXRHcm91cChkYXRhLCBncm91cHMpIHtcbiAgICBsZXQgb3B0cyA9IGdyb3Vwc1xuICAgICAgLm1hcCgoZ3JvdXApID0+IHtcbiAgICAgICAgY29uc3QgaXRlbXMgPSBkYXRhLmZpbHRlcigoZWwpID0+IGVsLmdyb3VwID09IGdyb3VwKTtcblxuICAgICAgICBsZXQgZ3JvdXBJdGVtID0gYDxsaSBjbGFzcz1cInAtMlwiPjxzdHJvbmcgZGF0YS1ncm91cD1cIiR7Z3JvdXB9XCIgY2xhc3M9XCJmdy1ib2xkXCI+JHtncm91cH08L3N0cm9uZz48L2xpPmA7XG5cbiAgICAgICAgbGV0IGdyb3VwT3B0cyA9IGl0ZW1zXG4gICAgICAgICAgLm1hcCgoZWwpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgPGxpPjxhIHN0eWxlPVwid2hpdGUtc3BhY2U6IHByZS13cmFwO2N1cnNvcjpwb2ludGVyO1wiIGNsYXNzPVwiZHJvcGRvd24taXRlbSAke1xuICAgICAgICAgICAgICB0aGlzLm5zXG4gICAgICAgICAgICB9LXZhclwiIGRhdGEtZ3JwPVwiJHtlbC5ncm91cH1cIiBkYXRhLXZhbHVlPVwiJHtlbC5uYW1lfVwiPiR7XG4gICAgICAgICAgICAgIGVsLmxhYmVsIHx8IGVsLm5hbWVcbiAgICAgICAgICAgIH08L2E+PC9saT5gO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmpvaW4oXCJcIik7XG5cbiAgICAgICAgcmV0dXJuIGdyb3VwSXRlbSArIGdyb3VwT3B0cztcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlwiKTtcblxuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgaWYgKGRhdGEubGVuZ3RoID4gdGhpcy50aHJlc2hvbGQpIHtcbiAgICAgIHRoaXMuaGFzU2VhcmNoID0gdHJ1ZTtcbiAgICAgIG9wdHMgPSBgPGxpPjxpbnB1dCBpZD1cIiR7aWR9XCIgcGxhY2Vob2xkZXI9XCJTZWFyY2hcIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIHAtMlwiIC8+JHtvcHRzfTxsaT5gO1xuICAgIH1cblxuICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmh0bWwob3B0cyk7XG4gICAgdGhpcy4jYmluZFZhcmlhYmxlQWRkKCk7XG4gICAgdGhpcy4jaGFuZGxlU2VhcmNoKGlkKTtcbiAgfVxuXG4gICN2YXJpYWJsZUlucHV0KGRhdGEpIHtcbiAgICBsZXQgb3B0cyA9IGRhdGFcbiAgICAgIC5tYXAoKGVsKSA9PiB7XG4gICAgICAgIHJldHVybiBgPGxpPjxhIHN0eWxlPVwid2hpdGUtc3BhY2U6IHByZS13cmFwO2N1cnNvcjpwb2ludGVyO1wiIGNsYXNzPVwiZHJvcGRvd24taXRlbSAke1xuICAgICAgICAgIHRoaXMubnNcbiAgICAgICAgfS12YXJcIiBkYXRhLXZhbHVlPVwiJHtlbC5uYW1lfVwiPiR7ZWwubGFiZWwgfHwgZWwubmFtZX08L2E+PC9saT5gO1xuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXCIpO1xuXG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBpZiAoZGF0YS5sZW5ndGggPiB0aGlzLnRocmVzaG9sZCkge1xuICAgICAgdGhpcy5oYXNTZWFyY2ggPSB0cnVlO1xuICAgICAgb3B0cyA9IGA8bGk+PGlucHV0IGlkPVwiJHtpZH1cIiBwbGFjZWhvbGRlcj1cIlNlYXJjaFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgZHJvcGRvd24taXRlbVwiIC8+JHtvcHRzfTxsaT5gO1xuICAgIH1cblxuICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmh0bWwob3B0cyk7XG4gICAgdGhpcy4jYmluZFZhcmlhYmxlQWRkKCk7XG4gICAgdGhpcy4jaGFuZGxlU2VhcmNoKGlkKTtcbiAgfVxuXG4gICNoYW5kbGVTZWFyY2goaWQpIHtcbiAgICBpZiAoJChgIyR7aWR9YCkubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgdGltZW91dDtcblxuICAgICQoYCMke2lkfWApLm9mZihcImtleXVwXCIpO1xuICAgICQoYCMke2lkfWApLm9uKFwia2V5dXBcIiwgKGUpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGxldCBxdWVyeSA9ICQoZS50YXJnZXQpLnZhbCgpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgbGV0IGxhc3RHcm91cEZvdW5kID0gXCJcIjtcbiAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYClcbiAgICAgICAgICAuZmluZChcImxpXCIpXG4gICAgICAgICAgLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHZhbHVlID0gJChlbCkuZmluZChcInN0cm9uZ1wiKS5kYXRhKFwiZ3JvdXBcIik7XG4gICAgICAgICAgICBsZXQgdHlwZSA9IFwiZ3JvdXBcIjtcblxuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICB0eXBlID0gXCJpdGVtXCI7XG4gICAgICAgICAgICAgIHZhbHVlID0gJChlbCkuZmluZChcImFcIikuZGF0YShcInZhbHVlXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJpdGVtXCIpIHtcbiAgICAgICAgICAgICAgbGV0IGdyb3VwID0gJChlbCkuZmluZChcImFcIikuZGF0YShcImdycFwiKTtcbiAgICAgICAgICAgICAgaWYgKGdyb3VwLnRvTG93ZXJDYXNlKCkgPT0gbGFzdEdyb3VwRm91bmQpIHtcbiAgICAgICAgICAgICAgICAkKGBbZGF0YS1ncm91cD0nJHtncm91cH0nXWApLnBhcmVudCgpLnNob3coKTtcbiAgICAgICAgICAgICAgICAkKGVsKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZS5pbmNsdWRlcyhxdWVyeSkpIHtcbiAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJpdGVtXCIpIHtcbiAgICAgICAgICAgICAgICBsZXQgZ3JvdXAgPSAkKGVsKS5maW5kKFwiYVwiKS5kYXRhKFwiZ3JwXCIpO1xuICAgICAgICAgICAgICAgICQoYFtkYXRhLWdyb3VwPScke2dyb3VwfSddYCkucGFyZW50KCkuc2hvdygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICh0eXBlID09IFwiZ3JvdXBcIikgbGFzdEdyb3VwRm91bmQgPSB2YWx1ZTtcblxuICAgICAgICAgICAgICAkKGVsKS5zaG93KCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHRleHQgPSAkKGVsKS50ZXh0KCk7XG5cbiAgICAgICAgICAgIGlmICh0ZXh0LmluY2x1ZGVzKHF1ZXJ5KSkge1xuICAgICAgICAgICAgICBpZiAodHlwZSA9PSBcIml0ZW1cIikge1xuICAgICAgICAgICAgICAgIGxldCBncm91cCA9ICQoZWwpLmZpbmQoXCJhXCIpLmRhdGEoXCJncnBcIik7XG4gICAgICAgICAgICAgICAgJChgW2RhdGEtZ3JvdXA9JyR7Z3JvdXB9J11gKS5wYXJlbnQoKS5zaG93KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJncm91cFwiKSBsYXN0R3JvdXBGb3VuZCA9IHZhbHVlO1xuXG4gICAgICAgICAgICAgICQoZWwpLnNob3coKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkKGVsKS5oaWRlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9LCAyNTApO1xuICAgIH0pO1xuICB9XG5cbiAgI2JpbmRWYXJpYWJsZUFkZCgpIHtcbiAgICAkKGAuJHt0aGlzLm5zfS12YXJgKS5vZmYoKTtcbiAgICAkKGAuJHt0aGlzLm5zfS12YXJgKS5vbihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICBsZXQgdmFsdWUgPSAkKGUudGFyZ2V0KS5kYXRhKFwidmFsdWVcIik7XG5cbiAgICAgIC8vIHJlbW92ZSB2YXJpYWJsZSBmcm9tIGRyb3Bkb3duXG4gICAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KFwibGlcIikucmVtb3ZlKCk7XG5cbiAgICAgIGZldGNoKGAke3RoaXMucGF0aFZhcmlhYmxlfSZ2YXJpYWJsZT0ke2VuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSl9YClcbiAgICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICB0aGlzLiNpbnNlcnRJbnB1dChkYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLmhhc1NlYXJjaCkge1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5maW5kKFwiLmRyb3Bkb3duLWl0ZW1cIikudmFsKFwiXCIpO1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5maW5kKFwiLmRyb3Bkb3duLWl0ZW1cIikuc2hvdygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydElucHV0KGlucHV0KSB7XG4gICAgc3dpdGNoIChpbnB1dC50eXBlKSB7XG4gICAgICBjYXNlIFwibnVtZXJpY1wiOlxuICAgICAgICB0aGlzLiNpbnNlcnROdW1lcmljKGlucHV0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZmFjdG9yXCI6XG4gICAgICAgIHRoaXMuI2luc2VydEZhY3RvcihpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImRhdGVcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0RGF0ZShpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImxvZ2ljYWxcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0TG9naWNhbChpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy4jaW5zZXJ0Q2hhcmFjdGVyKGlucHV0KTtcbiAgICB9XG4gIH1cblxuICAjYXBwZW5kRmlsdGVyKGRhdGEsIGNvbnRlbnQpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGNhcmQgPSBgPGRpdiBpZD0ke2lkfSBkYXRhLWdyb3VwPVwiJHtkYXRhLmdyb3VwfVwiIGRhdGEtbmFtZT1cIiR7XG4gICAgICBkYXRhLm5hbWVcbiAgICB9XCIgY2xhc3M9XCJjYXJkIG1iLTFcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImQtZmxleFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LWdyb3ctMVwiPlxuICAgICAgICAgICAgJHtkYXRhLmxhYmVsIHx8IGRhdGEubmFtZX1cbiAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1tdXRlZCBwLTAgbS0wXCI+JHtkYXRhLmRlc2NyaXB0aW9uIHx8IFwiXCJ9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LXNocmluay0xXCI+XG4gICAgICAgICAgICA8YSBjbGFzcz1cImZsb2F0LXJpZ2h0IGZpbHRlci1yZW1vdmVcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIHRleHQtd2FybmluZ1wiPjwvaT48L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICAke3RoaXMudmFyaWFibGVzT25seSA/IFwiXCIgOiBjb250ZW50fVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICAkKGAjJHt0aGlzLm5zfS1maWx0ZXJzYCkuYXBwZW5kKGNhcmQpO1xuICAgIHRoaXMuI2JpbmRSZW1vdmUoZGF0YSwgaWQpO1xuICB9XG5cbiAgI3NlbmQoKSB7XG4gICAgd2luZG93LlNoaW55LnNldElucHV0VmFsdWUoYCR7dGhpcy5uc30tdmFsdWVzYCwgdGhpcy52YWx1ZXMpO1xuICB9XG5cbiAgI2luc2VydE51bWVyaWMoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPGlucHV0IGlkPVwiJHtpZH1cIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwianMtcmFuZ2Utc2xpZGVyIGZpbHRlci1pbnB1dFwiIHZhbHVlPVwiXCIgLz5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgJChgIyR7aWR9YCkuaW9uUmFuZ2VTbGlkZXIoe1xuICAgICAgbWluOiBkYXRhLm1pbixcbiAgICAgIG1heDogZGF0YS5tYXgsXG4gICAgICBza2luOiBcInNoaW55XCIsXG4gICAgICBncmlkOiB0cnVlLFxuICAgICAgc3RlcDogZGF0YS5zdGVwLFxuICAgICAgdHlwZTogXCJkb3VibGVcIixcbiAgICB9KTtcblxuICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBbZGF0YS5taW4sIGRhdGEubWF4XTtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQ7XG4gICAgJChgIyR7aWR9YCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gJChldmVudC50YXJnZXQpXG4gICAgICAgIC52YWwoKVxuICAgICAgICAuc3BsaXQoXCI7XCIpXG4gICAgICAgIC5tYXAoKGVsKSA9PiBwYXJzZUZsb2F0KGVsKSk7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICAgIH0sIDI1MCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0Q2hhcmFjdGVyKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxpbnB1dCBpZD1cIiR7aWR9XCIgdmFsdWU9XCJcIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIGZpbHRlci1pbnB1dFwiLz5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFwiXCI7XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0O1xuICAgICQoYCMke2lkfWApLm9uKFwia2V5dXBcIiwgKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gJChldmVudC50YXJnZXQpLnZhbCgpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICB9LCAyNTApO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydEZhY3RvcihkYXRhKSB7XG4gICAgY29uc3Qgb3B0cyA9IGRhdGEudmFsdWVzXG4gICAgICAubWFwKChlbCkgPT4ge1xuICAgICAgICBpZiAoZWwgPT0gXCJudWxsXCIpIHtcbiAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGA8b3B0aW9uIHZhbHVlPVwiJHtlbH1cIj4ke2VsfTwvb3B0aW9uPmA7XG4gICAgICB9KVxuICAgICAgLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxzZWxlY3QgaWQ9XCIke2lkfVwiIGNsYXNzPVwiZmlsdGVyLWlucHV0XCI+JHtvcHRzfTwvc2VsZWN0PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBcIlwiO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYCMke2lkfWApLnNlbGVjdGl6ZSh7XG4gICAgICBtYXhJdGVtczogOTk5OSxcbiAgICB9KTtcbiAgICAkKGAjJHtpZH1gKVswXS5zZWxlY3RpemUuc2V0VmFsdWUobnVsbCk7XG4gICAgJChgIyR7aWR9YCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgdmFsID0gJChldmVudC50YXJnZXQpLnZhbCgpO1xuICAgICAgaWYgKHZhbC5sZW5ndGggPT0gMCkge1xuICAgICAgICBkZWxldGUgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXTtcbiAgICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgfVxuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IHZhbDtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnREYXRlKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cCBpbnB1dC1kYXRlcmFuZ2UgZmlsdGVyLWlucHV0XCI+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiZGF0ZVwiIGNsYXNzPVwiZm9ybS1jb250cm9sICR7aWR9LWRhdGVcIiB2YWx1ZT1cIiR7ZGF0YS5taW59XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC10ZXh0XCI+dG88L2Rpdj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJkYXRlXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgJHtpZH0tZGF0ZVwiIHZhbHVlPVwiJHtkYXRhLm1heH1cIj5cbiAgICAgIDwvZGl2PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gW2RhdGEubWluLCBkYXRhLm1heF07XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYC4ke2lkfS1kYXRlYCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgdmFsdWVzID0gW107XG4gICAgICAkKGV2ZW50LnRhcmdldClcbiAgICAgICAgLmNsb3Nlc3QoXCIuaW5wdXQtZ3JvdXBcIilcbiAgICAgICAgLmZpbmQoXCJpbnB1dFwiKVxuICAgICAgICAuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICB2YWx1ZXMucHVzaCgkKGVsKS52YWwoKSk7XG4gICAgICAgIH0pO1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IHZhbHVlcztcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRMb2dpY2FsKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxkaXYgY2xhc3M9XCJsb2dpY2FsLWZpbHRlclwiPlxuICAgICAgPGRpdiBjbGFzcz1cImZvcm0tY2hlY2sgZmlsdGVyLWlucHV0XCI+XG4gICAgICAgIDxpbnB1dCBjbGFzcz1cImZvcm0tY2hlY2staW5wdXQgJHtpZH0tbG9naWNhbFwiIHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImZvcm0tY2hlY2stbGFiZWxcIj5cbiAgICAgICAgICBUUlVFXG4gICAgICAgIDwvbGFiZWw+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmb3JtLWNoZWNrXCI+XG4gICAgICAgIDxpbnB1dCBjbGFzcz1cImZvcm0tY2hlY2staW5wdXQgJHtpZH0tbG9naWNhbFwiIHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImZvcm0tY2hlY2stbGFiZWxcIj5cbiAgICAgICAgICBGQUxTRVxuICAgICAgICA8L2xhYmVsPlxuICAgICAgPC9kaXY+XG4gICAgPGRpdj5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFt0cnVlLCBmYWxzZV07XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYC4ke2lkfS1sb2dpY2FsYCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgdmFsdWVzID0gW107XG4gICAgICAkKGV2ZW50LnRhcmdldClcbiAgICAgICAgLmNsb3Nlc3QoXCIubG9naWNhbC1maWx0ZXJcIilcbiAgICAgICAgLmZpbmQoXCJpbnB1dFwiKVxuICAgICAgICAuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICBsZXQgdmFsID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoaSA9PSAxKSB7XG4gICAgICAgICAgICB2YWwgPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoISQoZWwpLmlzKFwiOmNoZWNrZWRcIikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YWx1ZXMucHVzaCh2YWwpO1xuICAgICAgICB9KTtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSB2YWx1ZXM7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cbn1cblxuJCgoKSA9PiB7XG4gIHdpbmRvdy5TaGlueS5hZGRDdXN0b21NZXNzYWdlSGFuZGxlcihcImZsZXhmaWx0ZXItZW5kcG9pbnRzXCIsIChtc2cpID0+IHtcbiAgICBjb25zdCBmaWx0ZXIgPSBuZXcgRmlsdGVyKG1zZyk7XG4gICAgZmlsdGVyLmluaXQoKTtcbiAgfSk7XG59KTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgXCIuL2ZpbHRlci9pbmRleC5qc1wiO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9