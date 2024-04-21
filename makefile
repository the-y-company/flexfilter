install: check
	R -e "devtools::install()"

check: document
	R -e "devtools::check()"

bundle:
	R -e "packer::bundle_prod()"

bundle_dev:
	R -e "packer::bundle_dev()"

document: mkdoc
	R -e "devtools::document()"

mkdoc:
	mkdocs build
	
mkdoc_dev:
	mkdocs serve

dev: document bundle_dev
	Rscript test.R

