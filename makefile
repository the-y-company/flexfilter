install: check
	R -e "devtools::install()"

check: document
	R -e "devtools::check()"

bundle:
	R -e "packer::bundle_prod()"

bundle_dev:
	R -e "packer::bundle_dev()"

document:
	R -e "devtools::document()"

dev: document bundle_dev
	Rscript test.R

