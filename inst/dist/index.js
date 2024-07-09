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
    this.single = opts.single;
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

      if(this.single){
        $(`#${this.ns}-add`).show();
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

      timeout = setTimeout(() => {
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
              if (group != "" && group.toLowerCase() == lastGroupFound) {
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

            let text = $(el).text().toLowerCase();

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

      if(this.single){
        $(`#${this.ns}-add`).hide();
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
            <a class="float-right filter-remove"><i class="fa fa-trash text-danger"></i></a>
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
      .sort()
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LHlDQUF5QyxHQUFHO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLFVBQVUsR0FBRztBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNILENBQUM7Ozs7Ozs7VUN2YkQ7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGlDQUFpQyxXQUFXO1dBQzVDO1dBQ0E7Ozs7O1dDUEE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7O0FDTjJCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmxleGZpbHRlci8uL3NyY2pzL2ZpbHRlci9pbmRleC5qcyIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyLy4vc3JjanMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgRmlsdGVyIHtcbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIHRoaXMucGF0aFZhcmlhYmxlcyA9IG9wdHMucGF0aFZhcmlhYmxlcztcbiAgICB0aGlzLnBhdGhWYXJpYWJsZSA9IG9wdHMucGF0aFZhcmlhYmxlO1xuICAgIHRoaXMubnMgPSBvcHRzLm5zO1xuICAgIHRoaXMudmFyaWFibGVzT25seSA9IG9wdHMudmFyaWFibGVzT25seTtcbiAgICB0aGlzLnRocmVzaG9sZCA9IG9wdHMuc2VhcmNoVGhyZXNob2xkO1xuICAgIHRoaXMuc2luZ2xlID0gb3B0cy5zaW5nbGU7XG4gICAgdGhpcy5ncm91cHMgPSBmYWxzZTtcblxuICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgdGhpcy5oYXNTZWFyY2ggPSBmYWxzZTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgZmV0Y2godGhpcy5wYXRoVmFyaWFibGVzKVxuICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGxldCBncm91cHMgPSBkYXRhLm1hcCgoZWwpID0+IGVsLmdyb3VwKTtcbiAgICAgICAgZ3JvdXBzID0gWy4uLm5ldyBTZXQoZ3JvdXBzKV0uZmlsdGVyKChlbCkgPT4gZWwgIT0gbnVsbCk7XG5cbiAgICAgICAgaWYgKCFncm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy4jdmFyaWFibGVJbnB1dChkYXRhKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyb3VwcyA9IHRydWU7XG4gICAgICAgIHRoaXMuI3ZhcmlhYmxlSW5wdXRHcm91cChkYXRhLCBncm91cHMpO1xuICAgICAgfSk7XG4gIH1cblxuICAjbWFrZUlkKCkge1xuICAgIHJldHVybiBcIl9cIiArIE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApO1xuICB9XG5cbiAgI2JpbmRSZW1vdmUoZGF0YSwgaWQpIHtcbiAgICAkKGAjJHtpZH0gLmZpbHRlci1yZW1vdmVgKS5vbihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoXCIuY2FyZFwiKS5yZW1vdmUoKTtcblxuICAgICAgaWYgKCF0aGlzLmdyb3Vwcykge1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5hcHBlbmQoXG4gICAgICAgICAgYDxsaT48YSBzdHlsZT1cIndoaXRlLXNwYWNlOiBwcmUtd3JhcDtjdXJzb3I6cG9pbnRlcjtcIiBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHtcbiAgICAgICAgICAgIHRoaXMubnNcbiAgICAgICAgICB9LXZhclwiIGRhdGEtdmFsdWU9XCIke2RhdGEubmFtZX1cIj4ke2RhdGEubGFiZWwgfHwgZGF0YS5uYW1lfTwvYT48L2xpPmAsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkKFxuICAgICAgICAgIGA8bGk+PGEgc3R5bGU9XCJ3aGl0ZS1zcGFjZTogcHJlLXdyYXA7Y3Vyc29yOnBvaW50ZXI7XCIgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7XG4gICAgICAgICAgICB0aGlzLm5zXG4gICAgICAgICAgfS12YXJcIiBkYXRhLWdycD1cIiR7ZGF0YS5ncm91cH1cIiBkYXRhLXZhbHVlPVwiJHtkYXRhLm5hbWV9XCI+JHtcbiAgICAgICAgICAgIGRhdGEubGFiZWwgfHwgZGF0YS5uYW1lXG4gICAgICAgICAgfTwvYT48L2xpPmAsXG4gICAgICAgICkuaW5zZXJ0QWZ0ZXIoXG4gICAgICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYClcbiAgICAgICAgICAgIC5maW5kKGBbZGF0YS1ncm91cD1cIiR7ZGF0YS5ncm91cH1cIl1gKVxuICAgICAgICAgICAgLnBhcmVudCgpLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZih0aGlzLnNpbmdsZSl7XG4gICAgICAgICQoYCMke3RoaXMubnN9LWFkZGApLnNob3coKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy4jYmluZFZhcmlhYmxlQWRkKCk7XG4gICAgICBkZWxldGUgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXTtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICN2YXJpYWJsZUlucHV0R3JvdXAoZGF0YSwgZ3JvdXBzKSB7XG4gICAgbGV0IG9wdHMgPSBncm91cHNcbiAgICAgIC5tYXAoKGdyb3VwKSA9PiB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gZGF0YS5maWx0ZXIoKGVsKSA9PiBlbC5ncm91cCA9PSBncm91cCk7XG5cbiAgICAgICAgbGV0IGdyb3VwSXRlbSA9IGA8bGkgY2xhc3M9XCJwLTJcIj48c3Ryb25nIGRhdGEtZ3JvdXA9XCIke2dyb3VwfVwiIGNsYXNzPVwiZnctYm9sZFwiPiR7Z3JvdXB9PC9zdHJvbmc+PC9saT5gO1xuXG4gICAgICAgIGxldCBncm91cE9wdHMgPSBpdGVtc1xuICAgICAgICAgIC5tYXAoKGVsKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYDxsaT48YSBzdHlsZT1cIndoaXRlLXNwYWNlOiBwcmUtd3JhcDtjdXJzb3I6cG9pbnRlcjtcIiBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHtcbiAgICAgICAgICAgICAgdGhpcy5uc1xuICAgICAgICAgICAgfS12YXJcIiBkYXRhLWdycD1cIiR7ZWwuZ3JvdXB9XCIgZGF0YS12YWx1ZT1cIiR7ZWwubmFtZX1cIj4ke1xuICAgICAgICAgICAgICBlbC5sYWJlbCB8fCBlbC5uYW1lXG4gICAgICAgICAgICB9PC9hPjwvbGk+YDtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5qb2luKFwiXCIpO1xuXG4gICAgICAgIHJldHVybiBncm91cEl0ZW0gKyBncm91cE9wdHM7XG4gICAgICB9KVxuICAgICAgLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGlmIChkYXRhLmxlbmd0aCA+IHRoaXMudGhyZXNob2xkKSB7XG4gICAgICB0aGlzLmhhc1NlYXJjaCA9IHRydWU7XG4gICAgICBvcHRzID0gYDxsaT48aW5wdXQgaWQ9XCIke2lkfVwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoXCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbCBwLTJcIiAvPiR7b3B0c308bGk+YDtcbiAgICB9XG5cbiAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5odG1sKG9wdHMpO1xuICAgIHRoaXMuI2JpbmRWYXJpYWJsZUFkZCgpO1xuICAgIHRoaXMuI2hhbmRsZVNlYXJjaChpZCk7XG4gIH1cblxuICAjdmFyaWFibGVJbnB1dChkYXRhKSB7XG4gICAgbGV0IG9wdHMgPSBkYXRhXG4gICAgICAubWFwKChlbCkgPT4ge1xuICAgICAgICByZXR1cm4gYDxsaT48YSBzdHlsZT1cIndoaXRlLXNwYWNlOiBwcmUtd3JhcDtjdXJzb3I6cG9pbnRlcjtcIiBjbGFzcz1cImRyb3Bkb3duLWl0ZW0gJHtcbiAgICAgICAgICB0aGlzLm5zXG4gICAgICAgIH0tdmFyXCIgZGF0YS12YWx1ZT1cIiR7ZWwubmFtZX1cIj4ke2VsLmxhYmVsIHx8IGVsLm5hbWV9PC9hPjwvbGk+YDtcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlwiKTtcblxuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgaWYgKGRhdGEubGVuZ3RoID4gdGhpcy50aHJlc2hvbGQpIHtcbiAgICAgIHRoaXMuaGFzU2VhcmNoID0gdHJ1ZTtcbiAgICAgIG9wdHMgPSBgPGxpPjxpbnB1dCBpZD1cIiR7aWR9XCIgcGxhY2Vob2xkZXI9XCJTZWFyY2hcIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIGRyb3Bkb3duLWl0ZW1cIiAvPiR7b3B0c308bGk+YDtcbiAgICB9XG5cbiAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5odG1sKG9wdHMpO1xuICAgIHRoaXMuI2JpbmRWYXJpYWJsZUFkZCgpO1xuICAgIHRoaXMuI2hhbmRsZVNlYXJjaChpZCk7XG4gIH1cblxuICAjaGFuZGxlU2VhcmNoKGlkKSB7XG4gICAgaWYgKCQoYCMke2lkfWApLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQ7XG5cbiAgICAkKGAjJHtpZH1gKS5vZmYoXCJrZXl1cFwiKTtcbiAgICAkKGAjJHtpZH1gKS5vbihcImtleXVwXCIsIChlKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG5cbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gJChlLnRhcmdldCkudmFsKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICBsZXQgbGFzdEdyb3VwRm91bmQgPSBcIlwiO1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKVxuICAgICAgICAgIC5maW5kKFwibGlcIilcbiAgICAgICAgICAuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICAgIGlmIChpID09IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSAkKGVsKS5maW5kKFwic3Ryb25nXCIpLmRhdGEoXCJncm91cFwiKTtcbiAgICAgICAgICAgIGxldCB0eXBlID0gXCJncm91cFwiO1xuXG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgIHR5cGUgPSBcIml0ZW1cIjtcbiAgICAgICAgICAgICAgdmFsdWUgPSAkKGVsKS5maW5kKFwiYVwiKS5kYXRhKFwidmFsdWVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIml0ZW1cIikge1xuICAgICAgICAgICAgICBsZXQgZ3JvdXAgPSAkKGVsKS5maW5kKFwiYVwiKS5kYXRhKFwiZ3JwXCIpO1xuICAgICAgICAgICAgICBpZiAoZ3JvdXAgIT0gXCJcIiAmJiBncm91cC50b0xvd2VyQ2FzZSgpID09IGxhc3RHcm91cEZvdW5kKSB7XG4gICAgICAgICAgICAgICAgJChgW2RhdGEtZ3JvdXA9JyR7Z3JvdXB9J11gKS5wYXJlbnQoKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgJChlbCkuc2hvdygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodmFsdWUuaW5jbHVkZXMocXVlcnkpKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlID09IFwiaXRlbVwiKSB7XG4gICAgICAgICAgICAgICAgbGV0IGdyb3VwID0gJChlbCkuZmluZChcImFcIikuZGF0YShcImdycFwiKTtcbiAgICAgICAgICAgICAgICAkKGBbZGF0YS1ncm91cD0nJHtncm91cH0nXWApLnBhcmVudCgpLnNob3coKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodHlwZSA9PSBcImdyb3VwXCIpIGxhc3RHcm91cEZvdW5kID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgJChlbCkuc2hvdygpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCB0ZXh0ID0gJChlbCkudGV4dCgpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgIGlmICh0ZXh0LmluY2x1ZGVzKHF1ZXJ5KSkge1xuICAgICAgICAgICAgICBpZiAodHlwZSA9PSBcIml0ZW1cIikge1xuICAgICAgICAgICAgICAgIGxldCBncm91cCA9ICQoZWwpLmZpbmQoXCJhXCIpLmRhdGEoXCJncnBcIik7XG4gICAgICAgICAgICAgICAgJChgW2RhdGEtZ3JvdXA9JyR7Z3JvdXB9J11gKS5wYXJlbnQoKS5zaG93KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJncm91cFwiKSBsYXN0R3JvdXBGb3VuZCA9IHZhbHVlO1xuXG4gICAgICAgICAgICAgICQoZWwpLnNob3coKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkKGVsKS5oaWRlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9LCAyNTApO1xuICAgIH0pO1xuICB9XG5cbiAgI2JpbmRWYXJpYWJsZUFkZCgpIHtcbiAgICAkKGAuJHt0aGlzLm5zfS12YXJgKS5vZmYoKTtcbiAgICAkKGAuJHt0aGlzLm5zfS12YXJgKS5vbihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICBsZXQgdmFsdWUgPSAkKGUudGFyZ2V0KS5kYXRhKFwidmFsdWVcIik7XG5cbiAgICAgIC8vIHJlbW92ZSB2YXJpYWJsZSBmcm9tIGRyb3Bkb3duXG4gICAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KFwibGlcIikucmVtb3ZlKCk7XG5cbiAgICAgIGZldGNoKGAke3RoaXMucGF0aFZhcmlhYmxlfSZ2YXJpYWJsZT0ke2VuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSl9YClcbiAgICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICB0aGlzLiNpbnNlcnRJbnB1dChkYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLmhhc1NlYXJjaCkge1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5maW5kKFwiLmRyb3Bkb3duLWl0ZW1cIikudmFsKFwiXCIpO1xuICAgICAgICAkKGAjJHt0aGlzLm5zfS12YXJpYWJsZXNgKS5maW5kKFwiLmRyb3Bkb3duLWl0ZW1cIikuc2hvdygpO1xuICAgICAgfVxuXG4gICAgICBpZih0aGlzLnNpbmdsZSl7XG4gICAgICAgICQoYCMke3RoaXMubnN9LWFkZGApLmhpZGUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRJbnB1dChpbnB1dCkge1xuICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgY2FzZSBcIm51bWVyaWNcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0TnVtZXJpYyhpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImZhY3RvclwiOlxuICAgICAgICB0aGlzLiNpbnNlcnRGYWN0b3IoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJkYXRlXCI6XG4gICAgICAgIHRoaXMuI2luc2VydERhdGUoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJsb2dpY2FsXCI6XG4gICAgICAgIHRoaXMuI2luc2VydExvZ2ljYWwoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMuI2luc2VydENoYXJhY3RlcihpbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgI2FwcGVuZEZpbHRlcihkYXRhLCBjb250ZW50KSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBjYXJkID0gYDxkaXYgaWQ9JHtpZH0gZGF0YS1ncm91cD1cIiR7ZGF0YS5ncm91cH1cIiBkYXRhLW5hbWU9XCIke1xuICAgICAgZGF0YS5uYW1lXG4gICAgfVwiIGNsYXNzPVwiY2FyZCBtYi0xXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2FyZC1ib2R5XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJkLWZsZXhcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1ncm93LTFcIj5cbiAgICAgICAgICAgICR7ZGF0YS5sYWJlbCB8fCBkYXRhLm5hbWV9XG4gICAgICAgICAgICA8cCBjbGFzcz1cInRleHQtbXV0ZWQgcC0wIG0tMFwiPiR7ZGF0YS5kZXNjcmlwdGlvbiB8fCBcIlwifTwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1zaHJpbmstMVwiPlxuICAgICAgICAgICAgPGEgY2xhc3M9XCJmbG9hdC1yaWdodCBmaWx0ZXItcmVtb3ZlXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCB0ZXh0LWRhbmdlclwiPjwvaT48L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICAke3RoaXMudmFyaWFibGVzT25seSA/IFwiXCIgOiBjb250ZW50fVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICAkKGAjJHt0aGlzLm5zfS1maWx0ZXJzYCkuYXBwZW5kKGNhcmQpO1xuICAgIHRoaXMuI2JpbmRSZW1vdmUoZGF0YSwgaWQpO1xuICB9XG5cbiAgI3NlbmQoKSB7XG4gICAgd2luZG93LlNoaW55LnNldElucHV0VmFsdWUoYCR7dGhpcy5uc30tdmFsdWVzYCwgdGhpcy52YWx1ZXMpO1xuICB9XG5cbiAgI2luc2VydE51bWVyaWMoZGF0YSkge1xuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPGlucHV0IGlkPVwiJHtpZH1cIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwianMtcmFuZ2Utc2xpZGVyIGZpbHRlci1pbnB1dFwiIHZhbHVlPVwiXCIgLz5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgJChgIyR7aWR9YCkuaW9uUmFuZ2VTbGlkZXIoe1xuICAgICAgbWluOiBkYXRhLm1pbixcbiAgICAgIG1heDogZGF0YS5tYXgsXG4gICAgICBza2luOiBcInNoaW55XCIsXG4gICAgICBncmlkOiB0cnVlLFxuICAgICAgc3RlcDogZGF0YS5zdGVwLFxuICAgICAgdHlwZTogXCJkb3VibGVcIixcbiAgICB9KTtcblxuICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBbZGF0YS5taW4sIGRhdGEubWF4XTtcbiAgICB0aGlzLiNzZW5kKCk7XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZXNPbmx5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQ7XG4gICAgJChgIyR7aWR9YCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gJChldmVudC50YXJnZXQpXG4gICAgICAgIC52YWwoKVxuICAgICAgICAuc3BsaXQoXCI7XCIpXG4gICAgICAgIC5tYXAoKGVsKSA9PiBwYXJzZUZsb2F0KGVsKSk7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICAgIH0sIDI1MCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0Q2hhcmFjdGVyKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxpbnB1dCBpZD1cIiR7aWR9XCIgdmFsdWU9XCJcIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIGZpbHRlci1pbnB1dFwiLz5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFwiXCI7XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0O1xuICAgICQoYCMke2lkfWApLm9uKFwia2V5dXBcIiwgKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gJChldmVudC50YXJnZXQpLnZhbCgpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICB9LCAyNTApO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydEZhY3RvcihkYXRhKSB7XG4gICAgY29uc3Qgb3B0cyA9IGRhdGEudmFsdWVzXG4gICAgICAuc29ydCgpXG4gICAgICAubWFwKChlbCkgPT4ge1xuICAgICAgICBpZiAoZWwgPT0gXCJudWxsXCIpIHtcbiAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGA8b3B0aW9uIHZhbHVlPVwiJHtlbH1cIj4ke2VsfTwvb3B0aW9uPmA7XG4gICAgICB9KVxuICAgICAgLmpvaW4oXCJcIik7XG5cbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxzZWxlY3QgaWQ9XCIke2lkfVwiIGNsYXNzPVwiZmlsdGVyLWlucHV0XCI+JHtvcHRzfTwvc2VsZWN0PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcblxuICAgIGlmICh0aGlzLnZhcmlhYmxlc09ubHkpIHtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBcIlwiO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYCMke2lkfWApLnNlbGVjdGl6ZSh7XG4gICAgICBtYXhJdGVtczogOTk5OSxcbiAgICB9KTtcbiAgICAkKGAjJHtpZH1gKVswXS5zZWxlY3RpemUuc2V0VmFsdWUobnVsbCk7XG4gICAgJChgIyR7aWR9YCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgdmFsID0gJChldmVudC50YXJnZXQpLnZhbCgpO1xuICAgICAgaWYgKHZhbC5sZW5ndGggPT0gMCkge1xuICAgICAgICBkZWxldGUgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXTtcbiAgICAgICAgdGhpcy4jc2VuZCgpO1xuICAgICAgfVxuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IHZhbDtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnREYXRlKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cCBpbnB1dC1kYXRlcmFuZ2UgZmlsdGVyLWlucHV0XCI+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiZGF0ZVwiIGNsYXNzPVwiZm9ybS1jb250cm9sICR7aWR9LWRhdGVcIiB2YWx1ZT1cIiR7ZGF0YS5taW59XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC10ZXh0XCI+dG88L2Rpdj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJkYXRlXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgJHtpZH0tZGF0ZVwiIHZhbHVlPVwiJHtkYXRhLm1heH1cIj5cbiAgICAgIDwvZGl2PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gW2RhdGEubWluLCBkYXRhLm1heF07XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYC4ke2lkfS1kYXRlYCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgdmFsdWVzID0gW107XG4gICAgICAkKGV2ZW50LnRhcmdldClcbiAgICAgICAgLmNsb3Nlc3QoXCIuaW5wdXQtZ3JvdXBcIilcbiAgICAgICAgLmZpbmQoXCJpbnB1dFwiKVxuICAgICAgICAuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICB2YWx1ZXMucHVzaCgkKGVsKS52YWwoKSk7XG4gICAgICAgIH0pO1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IHZhbHVlcztcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRMb2dpY2FsKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxkaXYgY2xhc3M9XCJsb2dpY2FsLWZpbHRlclwiPlxuICAgICAgPGRpdiBjbGFzcz1cImZvcm0tY2hlY2sgZmlsdGVyLWlucHV0XCI+XG4gICAgICAgIDxpbnB1dCBjbGFzcz1cImZvcm0tY2hlY2staW5wdXQgJHtpZH0tbG9naWNhbFwiIHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImZvcm0tY2hlY2stbGFiZWxcIj5cbiAgICAgICAgICBUUlVFXG4gICAgICAgIDwvbGFiZWw+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmb3JtLWNoZWNrXCI+XG4gICAgICAgIDxpbnB1dCBjbGFzcz1cImZvcm0tY2hlY2staW5wdXQgJHtpZH0tbG9naWNhbFwiIHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImZvcm0tY2hlY2stbGFiZWxcIj5cbiAgICAgICAgICBGQUxTRVxuICAgICAgICA8L2xhYmVsPlxuICAgICAgPC9kaXY+XG4gICAgPGRpdj5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFt0cnVlLCBmYWxzZV07XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgaWYgKHRoaXMudmFyaWFibGVzT25seSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQoYC4ke2lkfS1sb2dpY2FsYCkub24oXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgdmFsdWVzID0gW107XG4gICAgICAkKGV2ZW50LnRhcmdldClcbiAgICAgICAgLmNsb3Nlc3QoXCIubG9naWNhbC1maWx0ZXJcIilcbiAgICAgICAgLmZpbmQoXCJpbnB1dFwiKVxuICAgICAgICAuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICBsZXQgdmFsID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoaSA9PSAxKSB7XG4gICAgICAgICAgICB2YWwgPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoISQoZWwpLmlzKFwiOmNoZWNrZWRcIikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YWx1ZXMucHVzaCh2YWwpO1xuICAgICAgICB9KTtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSB2YWx1ZXM7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cbn1cblxuJCgoKSA9PiB7XG4gIHdpbmRvdy5TaGlueS5hZGRDdXN0b21NZXNzYWdlSGFuZGxlcihcImZsZXhmaWx0ZXItZW5kcG9pbnRzXCIsIChtc2cpID0+IHtcbiAgICBjb25zdCBmaWx0ZXIgPSBuZXcgRmlsdGVyKG1zZyk7XG4gICAgZmlsdGVyLmluaXQoKTtcbiAgfSk7XG59KTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgXCIuL2ZpbHRlci9pbmRleC5qc1wiO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9