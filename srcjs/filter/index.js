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
      return `<option value=${el}>${el}</option>`;
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
