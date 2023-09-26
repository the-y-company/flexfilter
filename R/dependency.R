#' @importFrom htmltools htmlDependency
flexFilterDependency <- function() {
	htmlDependency(
		"flexfilter",
		version = utils::packageVersion("flexfilter"),
		src = "dist",
		package = "flexfilter",
		script = "index.js"
	)
}

selectizeDependency <- function(){
  utils::getFromNamespace("selectizeDependency", "shiny")()
}

ionRangeSliderDependency <- function(){
  utils::getFromNamespace("ionRangeSliderDependency", "shiny")()
}

fontawesomeDependency <- function(){
  utils::getFromNamespace("fa_html_dependency", "fontawesome")()
}

datePickerDependency <- function(){
  utils::getFromNamespace("datePickerDependency", "shiny")()
}
