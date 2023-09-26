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

    this.values = {};
  }

  init() {
    fetch(this.pathVariables)
      .then((res) => res.json())
      .then((data) => {
        this.#variableInput(data);
      });
  }

  #makeId() {
    return "_" + Math.ceil(Math.random() * 10000000);
  }

  #variableInput(data) {
    const opts = data.map((el) => {
      return `<li><a class="dropdown-item ${this.ns}-var" data-value="${el.name}">${
        el.label || el.name
      }</a></li>`;
    }).join("");
    $(`#${this.ns}-variables`).html(opts);
    this.#bindVariableAdd();
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
          <div class="flex-grow-1">${data.label || data.name}</div>
          <div class="flex-shrink-1">
            <a class="float-right filter-remove"><i class="fa fa-trash text-danger"></i></a>
          </div>
        </div>
        ${content}
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
      return `<option value=${el}>${el}</option>`;
    }).join("");

    const id = this.#makeId();
    const input = `<select id="${id}" class="filter-input">${opts}</select>`;
    this.#appendFilter(data, input);
    $(`#${id}`).selectize({
      maxItems: 9999,
    });
    $(`#${id}`)[0].selectize.setValue(null);
    this.values[data.name] = "";
    this.#send();
    $(`#${id}`).on("change", (event) => {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGlDQUFpQyxXQUFXO1dBQzVDO1dBQ0E7Ozs7O1dDUEE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7O0FDTjJCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmxleGZpbHRlci8uL3NyY2pzL2ZpbHRlci9pbmRleC5qcyIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZmxleGZpbHRlci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ZsZXhmaWx0ZXIvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9mbGV4ZmlsdGVyLy4vc3JjanMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgRmlsdGVyIHtcbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIHRoaXMucGF0aFZhcmlhYmxlcyA9IG9wdHMucGF0aFZhcmlhYmxlcztcbiAgICB0aGlzLnBhdGhWYXJpYWJsZSA9IG9wdHMucGF0aFZhcmlhYmxlO1xuICAgIHRoaXMubnMgPSBvcHRzLm5zO1xuXG4gICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgZmV0Y2godGhpcy5wYXRoVmFyaWFibGVzKVxuICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIHRoaXMuI3ZhcmlhYmxlSW5wdXQoZGF0YSk7XG4gICAgICB9KTtcbiAgfVxuXG4gICNtYWtlSWQoKSB7XG4gICAgcmV0dXJuIFwiX1wiICsgTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMCk7XG4gIH1cblxuICAjdmFyaWFibGVJbnB1dChkYXRhKSB7XG4gICAgY29uc3Qgb3B0cyA9IGRhdGEubWFwKChlbCkgPT4ge1xuICAgICAgcmV0dXJuIGA8bGk+PGEgY2xhc3M9XCJkcm9wZG93bi1pdGVtICR7dGhpcy5uc30tdmFyXCIgZGF0YS12YWx1ZT1cIiR7ZWwubmFtZX1cIj4ke1xuICAgICAgICBlbC5sYWJlbCB8fCBlbC5uYW1lXG4gICAgICB9PC9hPjwvbGk+YDtcbiAgICB9KS5qb2luKFwiXCIpO1xuICAgICQoYCMke3RoaXMubnN9LXZhcmlhYmxlc2ApLmh0bWwob3B0cyk7XG4gICAgdGhpcy4jYmluZFZhcmlhYmxlQWRkKCk7XG4gIH1cblxuICAjYmluZFZhcmlhYmxlQWRkKCkge1xuICAgICQoYC4ke3RoaXMubnN9LXZhcmApLm9mZigpO1xuICAgICQoYC4ke3RoaXMubnN9LXZhcmApLm9uKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGxldCB2YWx1ZSA9ICQoZS50YXJnZXQpLmRhdGEoXCJ2YWx1ZVwiKTtcblxuICAgICAgLy8gcmVtb3ZlIHZhcmlhYmxlIGZyb20gZHJvcGRvd25cbiAgICAgICQoZS50YXJnZXQpLmNsb3Nlc3QoXCJsaVwiKS5yZW1vdmUoKTtcblxuICAgICAgZmV0Y2goYCR7dGhpcy5wYXRoVmFyaWFibGV9JnZhcmlhYmxlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKX1gKVxuICAgICAgICAudGhlbigocmVzKSA9PiByZXMuanNvbigpKVxuICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgIHRoaXMuI2luc2VydElucHV0KGRhdGEpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnRJbnB1dChpbnB1dCkge1xuICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgY2FzZSBcIm51bWVyaWNcIjpcbiAgICAgICAgdGhpcy4jaW5zZXJ0TnVtZXJpYyhpbnB1dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImZhY3RvclwiOlxuICAgICAgICB0aGlzLiNpbnNlcnRGYWN0b3IoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJkYXRlXCI6XG4gICAgICAgIHRoaXMuI2luc2VydERhdGUoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJsb2dpY2FsXCI6XG4gICAgICAgIHRoaXMuI2luc2VydExvZ2ljYWwoaW5wdXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMuI2luc2VydENoYXJhY3RlcihpbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgI2FwcGVuZEZpbHRlcihkYXRhLCBjb250ZW50KSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBjYXJkID0gYDxkaXYgaWQ9JHtpZH0gZGF0YS1uYW1lPVwiJHtkYXRhLm5hbWV9XCIgY2xhc3M9XCJjYXJkIG1iLTFcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImQtZmxleFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LWdyb3ctMVwiPiR7ZGF0YS5sYWJlbCB8fCBkYXRhLm5hbWV9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZsZXgtc2hyaW5rLTFcIj5cbiAgICAgICAgICAgIDxhIGNsYXNzPVwiZmxvYXQtcmlnaHQgZmlsdGVyLXJlbW92ZVwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggdGV4dC1kYW5nZXJcIj48L2k+PC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgJHtjb250ZW50fVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICAkKGAjJHt0aGlzLm5zfS1maWx0ZXJzYCkuYXBwZW5kKGNhcmQpO1xuICAgIHRoaXMuI2JpbmRSZW1vdmUoZGF0YSwgaWQpO1xuICB9XG5cbiAgI2JpbmRSZW1vdmUoZGF0YSwgaWQpIHtcbiAgICAkKGAjJHtpZH0gLmZpbHRlci1yZW1vdmVgKS5vbihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoXCIuY2FyZFwiKS5yZW1vdmUoKTtcblxuICAgICAgJChgIyR7dGhpcy5uc30tdmFyaWFibGVzYCkuYXBwZW5kKFxuICAgICAgICBgPGxpPjxhIGNsYXNzPVwiZHJvcGRvd24taXRlbSAke3RoaXMubnN9LXZhclwiIGRhdGEtdmFsdWU9XCIke2RhdGEubmFtZX1cIj4ke1xuICAgICAgICAgIGRhdGEubGFiZWwgfHwgZGF0YS5uYW1lXG4gICAgICAgIH08L2E+PC9saT5gLFxuICAgICAgKTtcbiAgICAgIHRoaXMuI2JpbmRWYXJpYWJsZUFkZCgpO1xuICAgICAgZGVsZXRlIHRoaXMudmFsdWVzW2RhdGEubmFtZV07XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICAjc2VuZCgpIHtcbiAgICBTaGlueS5zZXRJbnB1dFZhbHVlKFxuICAgICAgYCR7dGhpcy5uc30tdmFsdWVzYCxcbiAgICAgIHRoaXMudmFsdWVzLFxuICAgICk7XG4gIH1cblxuICAjaW5zZXJ0TnVtZXJpYyhkYXRhKSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9XG4gICAgICBgPGlucHV0IGlkPVwiJHtpZH1cIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwianMtcmFuZ2Utc2xpZGVyIGZpbHRlci1pbnB1dFwiIHZhbHVlPVwiXCIgLz5gO1xuICAgIHRoaXMuI2FwcGVuZEZpbHRlcihkYXRhLCBpbnB1dCk7XG4gICAgJChgIyR7aWR9YClcbiAgICAgIC5pb25SYW5nZVNsaWRlcih7XG4gICAgICAgIG1pbjogZGF0YS5taW4sXG4gICAgICAgIG1heDogZGF0YS5tYXgsXG4gICAgICAgIHNraW46IFwic2hpbnlcIixcbiAgICAgICAgZ3JpZDogdHJ1ZSxcbiAgICAgICAgc3RlcDogZGF0YS5zdGVwLFxuICAgICAgICB0eXBlOiBcImRvdWJsZVwiLFxuICAgICAgfSk7XG5cbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gW2RhdGEubWluLCBkYXRhLm1heF07XG4gICAgdGhpcy4jc2VuZCgpO1xuICAgIGxldCB0aW1lb3V0O1xuICAgICQoYCMke2lkfWApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9ICQoZXZlbnQudGFyZ2V0KS52YWwoKS5zcGxpdChcIjtcIikubWFwKChlbCkgPT5cbiAgICAgICAgcGFyc2VGbG9hdChlbClcbiAgICAgICk7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICAgIH0sIDI1MCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0Q2hhcmFjdGVyKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID1cbiAgICAgIGA8aW5wdXQgaWQ9XCIke2lkfVwiIHZhbHVlPVwiXCIgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbCBmaWx0ZXItaW5wdXRcIi8+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBcIlwiO1xuICAgIHRoaXMuI3NlbmQoKTtcblxuICAgIGxldCB0aW1lb3V0O1xuICAgICQoYCMke2lkfWApLm9uKFwia2V5dXBcIiwgKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gJChldmVudC50YXJnZXQpLnZhbCgpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLiNzZW5kKCk7XG4gICAgICB9LCAyNTApO1xuICAgIH0pO1xuICB9XG5cbiAgI2luc2VydEZhY3RvcihkYXRhKSB7XG4gICAgY29uc3Qgb3B0cyA9IGRhdGEudmFsdWVzLm1hcCgoZWwpID0+IHtcbiAgICAgIHJldHVybiBgPG9wdGlvbiB2YWx1ZT0ke2VsfT4ke2VsfTwvb3B0aW9uPmA7XG4gICAgfSkuam9pbihcIlwiKTtcblxuICAgIGNvbnN0IGlkID0gdGhpcy4jbWFrZUlkKCk7XG4gICAgY29uc3QgaW5wdXQgPSBgPHNlbGVjdCBpZD1cIiR7aWR9XCIgY2xhc3M9XCJmaWx0ZXItaW5wdXRcIj4ke29wdHN9PC9zZWxlY3Q+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuICAgICQoYCMke2lkfWApLnNlbGVjdGl6ZSh7XG4gICAgICBtYXhJdGVtczogOTk5OSxcbiAgICB9KTtcbiAgICAkKGAjJHtpZH1gKVswXS5zZWxlY3RpemUuc2V0VmFsdWUobnVsbCk7XG4gICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9IFwiXCI7XG4gICAgdGhpcy4jc2VuZCgpO1xuICAgICQoYCMke2lkfWApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgdGhpcy52YWx1ZXNbZGF0YS5uYW1lXSA9ICQoZXZlbnQudGFyZ2V0KS52YWwoKTtcbiAgICAgIHRoaXMuI3NlbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICNpbnNlcnREYXRlKGRhdGEpIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuI21ha2VJZCgpO1xuICAgIGNvbnN0IGlucHV0ID0gYDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cCBpbnB1dC1kYXRlcmFuZ2UgZmlsdGVyLWlucHV0XCI+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiZGF0ZVwiIGNsYXNzPVwiZm9ybS1jb250cm9sICR7aWR9LWRhdGVcIiB2YWx1ZT1cIiR7ZGF0YS5taW59XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC10ZXh0XCI+dG88L2Rpdj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJkYXRlXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgJHtpZH0tZGF0ZVwiIHZhbHVlPVwiJHtkYXRhLm1heH1cIj5cbiAgICAgIDwvZGl2PmA7XG4gICAgdGhpcy4jYXBwZW5kRmlsdGVyKGRhdGEsIGlucHV0KTtcbiAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gW2RhdGEubWluLCBkYXRhLm1heF07XG4gICAgdGhpcy4jc2VuZCgpO1xuXG4gICAgJChgLiR7aWR9LWRhdGVgKS5vbihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGxldCB2YWx1ZXMgPSBbXTtcbiAgICAgICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFwiLmlucHV0LWdyb3VwXCIpLmZpbmQoXCJpbnB1dFwiKS5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICB2YWx1ZXMucHVzaCgkKGVsKS52YWwoKSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSB2YWx1ZXM7XG4gICAgICB0aGlzLiNzZW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICAjaW5zZXJ0TG9naWNhbChkYXRhKSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLiNtYWtlSWQoKTtcbiAgICBjb25zdCBpbnB1dCA9IGA8ZGl2IGNsYXNzPVwibG9naWNhbC1maWx0ZXJcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmb3JtLWNoZWNrIGZpbHRlci1pbnB1dFwiPlxuICAgICAgICA8aW5wdXQgY2xhc3M9XCJmb3JtLWNoZWNrLWlucHV0ICR7aWR9LWxvZ2ljYWxcIiB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPlxuICAgICAgICA8bGFiZWwgY2xhc3M9XCJmb3JtLWNoZWNrLWxhYmVsXCI+XG4gICAgICAgICAgVFJVRVxuICAgICAgICA8L2xhYmVsPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZm9ybS1jaGVja1wiPlxuICAgICAgICA8aW5wdXQgY2xhc3M9XCJmb3JtLWNoZWNrLWlucHV0ICR7aWR9LWxvZ2ljYWxcIiB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPlxuICAgICAgICA8bGFiZWwgY2xhc3M9XCJmb3JtLWNoZWNrLWxhYmVsXCI+XG4gICAgICAgICAgRkFMU0VcbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvZGl2PlxuICAgIDxkaXY+YDtcbiAgICB0aGlzLiNhcHBlbmRGaWx0ZXIoZGF0YSwgaW5wdXQpO1xuICAgIHRoaXMudmFsdWVzW2RhdGEubmFtZV0gPSBbdHJ1ZSwgZmFsc2VdO1xuICAgIHRoaXMuI3NlbmQoKTtcbiAgICAkKGAuJHtpZH0tbG9naWNhbGApLm9uKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgbGV0IHZhbHVlcyA9IFtdO1xuICAgICAgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoXCIubG9naWNhbC1maWx0ZXJcIikuZmluZChcImlucHV0XCIpLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgIGxldCB2YWwgPSB0cnVlO1xuICAgICAgICBpZiAoaSA9PSAxKSB7XG4gICAgICAgICAgdmFsID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoISQoZWwpLmlzKFwiOmNoZWNrZWRcIikpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YWx1ZXMucHVzaCh2YWwpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnZhbHVlc1tkYXRhLm5hbWVdID0gdmFsdWVzO1xuICAgICAgdGhpcy4jc2VuZCgpO1xuICAgIH0pO1xuICB9XG59XG5cbiQoKCkgPT4ge1xuICBTaGlueS5hZGRDdXN0b21NZXNzYWdlSGFuZGxlcihcImZsZXhmaWx0ZXItZW5kcG9pbnRzXCIsIChtc2cpID0+IHtcbiAgICBjb25zdCBmaWx0ZXIgPSBuZXcgRmlsdGVyKG1zZyk7XG4gICAgZmlsdGVyLmluaXQoKTtcbiAgfSk7XG59KTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgXCIuL2ZpbHRlci9pbmRleC5qc1wiO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9